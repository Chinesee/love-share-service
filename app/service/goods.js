'use strict'

const path = require('path')
const sendToWormhole = require('stream-wormhole')
const Service = require('egg').Service
const goodsField = 'name img_list category seller price collect_num views created_at'
const goodsSellerField = 'avatar_url real_name nickname credit_value share_value'

class GoodsService extends Service {
  async createGoods(_id, data) {
    const { ctx } = this
    data.seller = _id
    const goods = new ctx.model.Goods(data)
    try {
      const { _id: goods_id } = await goods.save()
      await ctx.model.User.updateOne(
        { _id },
        {
          $push: {
            published_goods: { $each: [goods_id], $position: 0 },
          },
        }
      )
      return { code: 2000, msg: '成功创建商品' }
    } catch (err) {
      return { code: 5000, msg: err.message }
    }
  }

  async deleteGoods(_id) {
    const { ctx, service } = this
    try {
      const { img_list } = await ctx.model.Goods.findOne({ _id })

      if (img_list) {
        const { code } = await service.goods.deleteImg(img_list) // 首先删除商品的图片
        if (code === 2000) {
          const { deletedCount } = await ctx.model.Goods.deleteOne({ _id })
          if (deletedCount === 1) {
            return { code: 2000, msg: '删除商品成功' }
          }
          return { code: 3000, msg: '无任何商品被删除' }
        }
      }
      throw new Error('删除商品的过程中删除图片失败')
    } catch (err) {
      return { code: 5000, msg: err.message }
    }
  }

  updateGoods(data) {
    return this.ctx.model.Goods
      .updateOne({ _id: data.goods_id }, data)
      .then(({ nModified }) => {
        if (nModified === 1) {
          return { code: 2000, msg: '成功更新商品信息' }
        }
        return { code: 2000, msg: '没有更新任何商品' }
      })
      .catch(err => {
        return { code: 5000, msg: err.message }
      })
  }

  updateManyGoods(data) {
    return this.ctx.model.Goods
      .updateMany(
        { _id: { $in: data.goods_id_list } },
        data
      )
      .then(({ nModified }) => {
        if (nModified === data.goods_id_list.length) {
          return { code: 2000, msg: '全部商品的状态已更新' }
        }
        return { code: 3000, msg: '部分商品的状态更新失败' }
      })
      .catch(err => {
        return { code: 5000, msg: err.message }
      })
  }

  async editGoods(_id, data) {
    data.seller = _id
    return this.ctx.model.Goods
      .updateOne({ _id: data._id, status: { $in: [1, 3] } }, data)
      .then(({ nModified }) => {
        if (nModified === 1) {
          return { code: 2000, msg: '成功编辑商品信息' }
        }
        return { code: 3000, msg: '没有可以编辑的商品信息' }
      })
      .catch(err => {
        return { code: 5000, msg: err.message }
      })
  }

  async getRecommendGoodsList(_id, { page, page_size: pageSize }) {
    const { ctx } = this
    const fields = 'img_list name price seller'
    // if (_id) {
    //   const { collections } = await ctx.model.User.findOne({ _id }, 'collections')
    //   if (collections.length > 0) {
    //     const category_ids = [...new Set(collections.map(el => String(el._id)))]
    //     const res = await ctx.model.Goods.find({ category: { $in: category_ids } }, fields)
    //     console.log(res)
    //   }
    // }

    const [total, goods_list] = await Promise.all([
      ctx.model.Goods.countDocuments({ status: 1 }),
      ctx.model.Goods
        .find({ status: 1 }, fields)
        .sort({ created_at: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
    ])
    const pagination = {
      page,
      pageSize,
      total,
    }
    return { code: 2000, msg: '查询推荐商品列表', data: { goods_list, pagination } }
  }

  async getGoodsListBySearch({ page, page_size: pageSize, search }) {
    const { ctx } = this
    const str = search.replace(/([()[\]{}\\/^$|?*+.])/g, '\\$1')
    const reg = new RegExp(str.toLowerCase().trim(), 'i')
    const [goods_list] = await Promise.all([
      ctx.model.Goods.aggregate([
        {
          $match: {
            name: { $regex: reg },
            status: 1,
          },
        },
        { $project: { name: 1, price: 1, img_list: 1, created_at: 1 } },
        { $sort: { created_at: -1 } },
        { $skip: (page - 1) * pageSize },
        { $limit: pageSize },
      ]),
    ])
    const pagination = {
      page,
      pageSize,
      total: goods_list.length,
    }
    return {
      code: 2000,
      msg: '获取搜索的商品列表',
      data: { goods_list, pagination },
    }
  }

  async getGoodsListByCategory({ page, page_size: pageSize, category }) {
    const { ctx, app } = this
    const [total, goods_list] = await Promise.all([
      ctx.model.Goods.countDocuments({
        status: 1,
        category: { $in: [app.mongoose.Types.ObjectId(category)] },
      }),
      ctx.model.Goods.aggregate([
        {
          $match: {
            category: { $in: [app.mongoose.Types.ObjectId(category)] },
            status: 1,
          },
        },
        { $project: { name: 1, price: 1, img_list: 1, created_at: 1 } },
        { $sort: { created_at: -1 } },
        { $skip: (page - 1) * pageSize },
        { $limit: pageSize },
      ]),
      ctx.model.Category.updateOne({ _id: category }, { $inc: { hit: 1 } }),
    ])
    const pagination = {
      page,
      pageSize,
      total,
    }
    return { code: 2000, msg: '获取某分类的商品列表', data: { goods_list, pagination } }
  }

  async getGoodsListByFilter({ page, page_size: pageSize, category, search, min_price, max_price }) {
    const { ctx, app } = this
    const base = {
      status: 1,
      category: { $in: [app.mongoose.Types.ObjectId(category)] },
    }
    if (search && search.trim().length > 0) {
      const str = search.replace(/([()[\]{}\\/^$|?*+.])/g, '\\$1')
      const reg = new RegExp(str.toLowerCase().trim(), 'i')
      base.name = { $regex: reg }
    }
    if (min_price >= 0 && max_price >= 0 && min_price <= max_price) {
      base.price = { $gte: min_price, $lte: max_price }
    }
    console.log(base)

    const [total, goods_list] = await Promise.all([
      ctx.model.Goods.countDocuments(base),
      ctx.model.Goods.aggregate([
        { $match: base },
        { $project: { name: 1, price: 1, img_list: 1, created_at: 1 } },
        { $sort: { created_at: -1 } },
        { $skip: (page - 1) * pageSize },
        { $limit: pageSize },
      ]),
      ctx.model.Category.updateOne({ _id: category }, { $inc: { hit: 1 } }),
    ])
    const pagination = {
      page,
      pageSize,
      total,
    }
    return { code: 2000, msg: '根据过滤条件获取商品列表', data: { goods_list, pagination } }
  }

  async getGoodsListBySchoolOrCategory({ school_id, category = null, page, page_size: pageSize }) {
    const { ctx, app } = this
    let match

    if (category) {
      const categories = category.map(el => app.mongoose.Types.ObjectId(el))
      match = {
        status: 1,
        category: { $in: categories },
        'seller.school': app.mongoose.Types.ObjectId(school_id),
      }
    } else {
      match = {
        status: 1,
        'seller.school': app.mongoose.Types.ObjectId(school_id),
      }
    }

    const [total, goods_list] = await Promise.all([
      ctx.model.Goods.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'seller',
            foreignField: '_id',
            as: 'seller',
          },
        },
        { $match: match },
        { $project: { _id: 1 } },
      ]),
      ctx.model.Goods.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'seller',
            foreignField: '_id',
            as: 'seller',
          },
        },
        { $match: match },
        { $project: { name: 1, price: 1, img_list: 1, created_at: 1 } },
        { $sort: { created_at: -1 } },
        { $skip: (page - 1) * pageSize },
        { $limit: pageSize },
      ]),
    ])
    const pagination = {
      page,
      pageSize,
      total: total.length,
    }
    return { code: 2000, msg: '根据分类查询同校商品列表', data: { goods_list, pagination } }
  }

  /* 管理员 */
  async getGoodsListByStatus(status, { page, page_size: pageSize }) {
    const [total, goods_list] = await Promise.all([
      this.ctx.model.Goods.countDocuments({ status }),
      this.ctx.model.Goods
        .find({ status }, goodsField)
        .populate('seller', goodsSellerField)
        .populate('category', 'name')
        .skip((page - 1) * pageSize)
        .limit(pageSize),
    ])
    const pagination = {
      page,
      pageSize,
      total,
    }
    return { code: 2000, msg: '根据商品状态查询商品列表', data: { goods_list, pagination } }
  }

  /* 管理员 */
  async getGoodsListBySearchAdmin({ page, page_size: pageSize, search }) {
    const { ctx } = this
    const str = search.replace(/([()[\]{}\\/^$|?*+.])/g, '\\$1')
    const reg = new RegExp(str.toLowerCase().trim(), 'i')
    return ctx.model.Goods.find({ name: { $regex: reg } }, goodsField)
      .populate('seller', goodsSellerField)
      .populate('category', 'name')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .then(goods_list => {
        const pagination = {
          page,
          pageSize,
          total: goods_list.length,
        }
        return {
          code: 2000,
          msg: '获取搜索的商品列表',
          data: { goods_list, pagination },
        }
      })
  }

  /* 管理员 */
  async getGoodsListByDateRange({ date_range, page, page_size: pageSize }) {
    const [total, goods_list] = await Promise.all([
      this.ctx.model.Goods.countDocuments({
        created_at: {
          $gte: new Date(`${date_range[0]} 00:00:00`),
          $lte: new Date(`${date_range[1]} 23:59:59`),
        },
      }),
      this.ctx.model.Goods
        .find({
          status: 1,
          created_at: {
            $gte: new Date(`${date_range[0]} 00:00:00`),
            $lte: new Date(`${date_range[1]} 23:59:59`),
          },
        }, goodsField)
        .populate('seller', goodsSellerField)
        .populate('category', 'name')
        .skip((page - 1) * pageSize)
        .limit(pageSize),
    ])
    const pagination = {
      page,
      pageSize,
      total,
    }
    return { code: 2000, msg: '根据日期范围查询商品', data: { goods_list, pagination } }
  }

  /* 管理员 */
  async getGoodsListBySchoolOrCategoryAdmin({ category = null, school_id = null, page, page_size: pageSize }) {
    const { app, ctx } = this
    let match = { status: 1 }

    if (category && school_id) {
      match = {
        status: 1,
        category: app.mongoose.Types.ObjectId(category),
        'seller.school': app.mongoose.Types.ObjectId(school_id),
      }
    } else if (category && !school_id) {
      match = { status: 1, category: app.mongoose.Types.ObjectId(category) }
    } else if (!category && school_id) {
      match = { status: 1, 'seller.school': app.mongoose.Types.ObjectId(school_id) }
    }

    const goods_list = await ctx.model.Goods.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller',
        },
      },
      { $match: match },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$seller' },
      {
        $project: {
          name: 1,
          price: 1,
          img_list: 1,
          collect_num: 1,
          status: 1,
          created_at: 1,
          category: 1,
          views: 1,
          'seller.avatar_url': 1,
          'seller.school': 1,
          'seller.real_name': 1,
          'seller.nickname': 1,
          'seller.credit_value': 1,
          'seller.share_value': 1,
        },
      },
      { $sort: { created_at: -1 } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
    ])
    const pagination = {
      page,
      pageSize,
      total: goods_list.length,
    }
    return { code: 2000, msg: '根据学校或分类获取商品列表', data: { goods_list, pagination } }
  }

  getGoodsDetail({ goods_id: _id, viewed = false }) {
    return this.ctx.model.Goods
      .findOne({ _id }, '-comments')
      .populate('category', '-_id name')
      .then(async goods_detail => {
        if (!viewed) {
          await this.ctx.model.Goods.updateOne({ _id }, { $inc: { views: 1 } })
        }
        return { code: 2000, msg: '查询商品详情', data: { goods_detail } }
      })
      .catch(err => ({ code: 5000, msg: err.message }))
  }

  async uploadImg(id, parts) {
    const { app } = this
    let part
    const result = []
    const imgList = []
    while ((part = await parts()) != null) {
      if (part.length) {
        //
      } else {
        if (!part.filename) {
          return { code: 5000, msg: '图片上传失败' }
        }
        try {
          const res = await app.fullQiniu.uploadStream(
            `${id}-${path.basename(part.filename)}`,
            part
          )
          if (res.ok) {
            imgList.push(decodeURI(res.url))
            result.push(true)
          } else {
            result.push(false)
          }
        } catch {
          // 必须将上传的文件流消费掉，要不然浏览器响应会卡死
          await sendToWormhole(part)
          result.push(false)
        }
      }
    }

    if (result.every(Boolean)) {
      return { code: 2000, data: { img_list: imgList }, msg: '所有图片上传成功' }
    }

    let msg
    if (result.some(Boolean)) {
      msg = '部分图片上传失败'
    } else {
      msg = '图片上传失败'
    }
    await app.fullQiniu.batchDelete(imgList.map(el => path.basename(el)))
    return { code: 5000, msg }
  }

  async deleteImg(imgList) {
    const { app } = this
    const files = imgList.map(el => path.basename(el))
    const { ok, list } = await app.fullQiniu.batchDelete(files)

    if (ok) {
      if (list.every(li => li.code === 200)) {
        return { code: 2000, msg: '所有图片删除成功' }
      }
      return { code: 5001, msg: '部分图片删除失败' }
    }
    return { code: 5000, msg: '所有图片删除失败' }
  }

  async getGoodsSeller(_id) {
    const { app, ctx } = this
    const { seller } = await ctx.model.Goods
      .findOne({ _id }, 'seller')
      .populate({
        path: 'seller',
        select: 'avatar_url nickname school gender credit_value',
        populate: { path: 'school', select: '-_id name' },
      })
    const [published_num, [{ fans_num }]] = await Promise.all([
      ctx.model.Goods.countDocuments({ seller: seller._id }),
      ctx.model.User.aggregate([
        { $match: { _id: app.mongoose.Types.ObjectId(seller._id) } },
        {
          $project: {
            _id: 0,
            fans_num: { $size: '$fans' },
          },
        },
      ]),
    ])
    Object.assign(seller._doc, { published_num, fans_num })
    return { code: 2000, msg: '获取商品卖家信息', data: { seller } }
  }

  async getGoodsComments({ goods_id: _id, page, page_size }) {
    const { ctx, app } = this
    const [{ comments }, [{ total }]] = await Promise.all([
      ctx.model.Goods
        .findOne({ _id }, { comments: { $slice: [(page - 1) * page_size, page_size] } })
        .populate({
          path: 'comments.sender',
          select: 'avatar_url nickname',
        })
        .populate({
          path: 'comments.replies.sender',
          select: 'nickname',
        })
        .populate({
          path: 'comments.replies.at',
          select: 'nickname',
        }),
      ctx.model.Goods.aggregate([
        { $match: { _id: app.mongoose.Types.ObjectId(_id) } },
        {
          $project: {
            _id: 0,
            total: { $size: '$comments' },
          },
        },
      ]),
    ])
    return {
      code: 2000,
      msg: '获取商品留言',
      data: {
        comments,
        pagination: {
          total, page, page_size,
        },
      },
    }
  }

  async postReview({ reviews }) {
    const res = await Promise.all(
      reviews.map(
        ({ _id, star, content }) => this.ctx.model.Goods.updateOne(
          { _id },
          { review: { star, content } }
        )
      )
    )
    if (res.every(el => el.nModified === 1)) {
      return { code: 2000, msg: '成功评价商品' }
    }
    return { code: 5000, msg: '评价商品失败' }
  }

  postComment(_id, { owner, goods_id, content }) {
    const { ctx, service } = this
    return ctx.model.Goods
      .updateOne(
        { _id: goods_id },
        { $push: { comments: { $each: [{ content, sender: _id }], $position: 0 } } },
        { runValidators: true }
      )
      .then(({ nModified }) => {
        if (nModified === 1) {
          if (_id !== owner) {
            service.notice.addNotice(owner, {
              title: '收到商品留言',
              content: `有人给您的商品留言了：<b>${content}</b>，快去看看吧~`,
              type: 1,
            })
          }
          return { code: 2000, msg: '已成功发送一条留言' }
        }
        return { code: 3000, msg: '留言失败' }
      })
      .catch(err => {
        return { code: 5000, msg: err.message }
      })
  }

  changeComment(_id, { goods_id, comment_id, content }) {
    const { ctx } = this
    return ctx.model.Goods
      .updateOne(
        { _id: goods_id, 'comments._id': comment_id },
        { 'comments.$.content': content },
        { runValidators: true }
      )
      .then(({ nModified }) => {
        if (nModified === 1) {
          return { code: 2000, msg: '已成功修改一条留言' }
        }
      })
      .catch(err => {
        return { code: 5000, msg: err.message }
      })
  }

  replyComment(_id, { goods_id, comment_id, at, content }) {
    const { ctx, service } = this
    return ctx.model.Goods
      .updateOne(
        { _id: goods_id, 'comments._id': comment_id },
        {
          $push: { 'comments.$.replies': { sender: _id, at, content } },
        },
        { runValidators: true }
      )
      .then(({ nModified }) => {
        if (nModified === 1) {
          if (_id !== at) {
            service.notice.addNotice(at, {
              title: '收到留言回复',
              content: `有人回复了您的留言 [<b>${content}</b>] ，快去看看哦~`,
              type: 1,
            })
          }
          return { code: 2000, msg: '已成功回复一条留言' }
        }
        return { code: 3000, msg: '回复留言失败' }
      })
      .catch(err => {
        return { code: 5000, msg: err.message }
      })
  }

  isGoodsCollected(_id, { goods_id }) {
    return this.ctx.model.User
      .findOne({ _id }, 'collections')
      .then(({ collections }) => {
        const is_collected = collections.some(el => String(el.goods) === goods_id)
        return { code: 2000, msg: '是否收藏了该商品', data: { is_collected } }
      })
  }

  async getGoodsListInfo() {
    const [on_sell_count, off_sell_count] = await Promise.all([
      this.ctx.model.Goods.countDocuments({ status: 1 }),
      this.ctx.model.Goods.countDocuments({ status: 3 }),
    ])
    return { code: 2000, data: { on_sell_count, off_sell_count } }
  }
}

module.exports = GoodsService
