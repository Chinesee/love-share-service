'use strict'

const path = require('path')
const sendToWormhole = require('stream-wormhole')
const Service = require('egg').Service

class GoodsService extends Service {
  async createGoods(_id, data) {
    data.seller = _id
    const goods = new this.ctx.model.Goods(data)
    try {
      await goods.save()
      return { code: 2000, msg: '成功创建商品' }
    } catch (err) {
      return { code: 5000, msg: err.message }
    }
  }

  async deleteGoods(_id) {
    const { ctx } = this
    try {
      const { img_list } = await ctx.model.Goods.findOne({ _id })

      if (img_list) {
        const { code } = await this.deleteImg(img_list)
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

  async getRecommendGoodsList(_id, { page, page_size: pageSize }) {
    const [ total, goods_list ] = await Promise.all([
      this.ctx.model.Goods.estimatedDocumentCount(),
      this.ctx.model.Goods
        .find({}, 'img_list name price')
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

  async getGoodsList({ page, page_size: pageSize }) {
    const [ total, goods_list ] = await Promise.all([
      this.ctx.model.Goods.estimatedDocumentCount(),
      this.ctx.model.Goods
        .find({}, 'name category created_at')
        .skip((page - 1) * pageSize)
        .limit(pageSize),
    ])
    const pagination = {
      page,
      pageSize,
      total,
    }
    return { code: 2000, msg: '查询商品列表', data: { goods_list, pagination } }
  }

  getGoodsDetail(_id) {
    return this.ctx.model.Goods
      .findOne({ _id })
      .populate('category', '-_id name')
      .populate({
        path: 'seller',
        select: '-_id avatar_url nickname school gender credit_value fans published_goods',
        populate: { path: 'school', select: '-_id name' },
      })
      .then(goods_detail => {
        return { code: 2000, msg: '查询商品详情', data: { goods_detail } }
      })
      .catch(err => {
        return { code: 5000, msg: err.message }
      })
  }

  async getCartList() {
    const cart_list = [
      {
        goods_id: () => '123456',
        img_list: [ 'https://cdn-demo.algolia.com/bestbuy-0118/4397400_sb.jpg' ],
        goods_num: 1,
        name: '富婆快乐球',
        nickname: '令狐少侠',
        real_name: '陈梓聪',
        quantity: 1,
        amount: 1,
        delivery: 1,
        delivery_charge: 0,
        price: 29.90,
        collect_num: 4,
        is_collected: true,
        time: '2019-10-21',
      },
    ]
    return { code: 2000, msg: '获取购物车列表', data: { cart_list } }
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
            imgList.push(res.url)
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
    } else if (result.some(Boolean)) {
      return { code: 5000, msg: '部分图片上传失败' }
    }
    return { code: 5000, msg: '图片上传失败' }
  }

  async deleteImg(imgList) {
    const { app } = this
    const files = imgList.map(el => {
      return path.basename(el)
    })
    const { ok, list } = await app.fullQiniu.batchDelete(files)

    if (ok) {
      if (list.every(li => li.code === 200)) {
        return { code: 2000, msg: '所有图片删除成功' }
      }
      return { code: 5001, msg: '部分图片删除失败' }
    }
    return { code: 5000, msg: '所有图片删除失败' }
  }
}

module.exports = GoodsService
