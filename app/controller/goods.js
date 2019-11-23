'use strict'

const Controller = require('egg').Controller


class GoodsController extends Controller {
  /* GET
   * 获取商品列表
   */
  async getGoodsList() {
    const { ctx, service } = this
    const data = ctx.request.body
    const res = await service.goods.getGoodsList(data)

    ctx.body = res
    ctx.status = 200
  }

  /* POST
   * 图片上传
   */
  async uploadImg() {
    const { ctx, service } = this
    const id = ctx.state.user.id
    const files = ctx.request.files
    const res = await service.goods.uploadImg(id, files)

    ctx.body = res
    ctx.status = 200
  }

  /* DELETE
   * 删除已上传的图片
   */
  async deleteImg() {
    const { ctx, service } = this
    const { img_list, img_with_id = true } = ctx.request.body
    if (!img_with_id) {
      const id = ctx.state.user.id
      img_list.forEach((it, i, _) => {
        _[i] = `${id}-${it}`
      })
    }
    const res = await service.goods.deleteImg(img_list)

    ctx.body = res
    ctx.status = 200
  }
}

module.exports = GoodsController