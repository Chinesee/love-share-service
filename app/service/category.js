'use strict'

const Service = require('egg').Service

class CategoryService extends Service {
  getCategoryList() {
    return this.ctx.model.Category
      .find({})
      .then(category_list => {
        return { code: 2000, msg: '获取商品分类列表', data: { category_list } }
      })
  }

  async addCategory({ category_name: name }) {
    try {
      const category = new this.ctx.model.Category({ name })
      await category.save()
      return { code: 2000, msg: '成功添加分类' }
    } catch (err) {
      if (err.message.includes('duplicate key')) {
        return { code: 4003, msg: '不能重复添加分类' }
      }
      return { code: 5000, msg: err.message }
    }
  }

  async deleteCategory({ category_id_list }) {
    const { ctx, service } = this
    const res = await service.category.checkCategory(category_id_list)

    if (res.code === 2000) {
      return ctx.model.Category
        .deleteMany({ _id: { $in: category_id_list } })
        .then(({ deletedCount }) => {
          if (deletedCount === category_id_list.length) {
            return { code: 2000, msg: '成功删除分类' }
          }
          return { code: 3000, msg: '没有删除分类' }
        })
    }
    return res
  }

  async updateCategoryActivation({ category_id_list, activation }) {
    const { ctx, service } = this
    const res = await service.category.checkCategory(category_id_list)

    if (res.code === 2000) {
      return ctx.model.Category
        .updateMany(
          { _id: { $in: category_id_list } },
          { activation }
        )
        .then(({ nModified }) => {
          if (nModified === category_id_list.length) {
            return { code: 2000, msg: '成功更新分类激活状态' }
          }
        })
    }
    return res
  }

  async checkCategory(category_id_list) {
    const res = await this.ctx.model.Goods.findOne({ category: { $in: category_id_list } })
    if (res) {
      return { code: 4003, msg: '无法操作，该分类下存在相应商品' }
    }
    return { code: 2000 }
  }
}

module.exports = CategoryService
