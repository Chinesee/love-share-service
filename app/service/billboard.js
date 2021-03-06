'use strict'

const path = require('path')
const sendToWormhole = require('stream-wormhole')
const Service = require('egg').Service

class BillboardService extends Service {
  getBillboardList() {
    return this.ctx.model.Billboard
      .find({})
      .then(billboard_list => {
        return { code: 2000, msg: '获取广告图片列表', data: { billboard_list } }
      })
  }

  async uploadBillboard(parts) {
    const { app } = this
    let part
    let img_url
    while ((part = await parts()) != null) {
      if (part.length) {
        //
      } else {
        if (!part.filename) {
          return { code: 5000, msg: '图片上传失败' }
        }
        try {
          const { ok, url } = await app.fullQiniu.uploadStream(
            `billboard-${path.basename(part.filename)}`,
            part
          )
          if (ok) {
            img_url = decodeURI(url)
            const billboard = new this.ctx.model.Billboard({ url: decodeURI(url) })
            await billboard.save()
          }
        } catch (err) {
          // 必须将上传的文件流消费掉，要不然浏览器响应会卡死
          await app.fullQiniu.delete(path.basename(img_url))
          await sendToWormhole(part)
          throw err
        }
      }
    }
    return { code: 2000, msg: '图片上传成功' }
  }

  async deleteBillboard({ _id, url }) {
    const { app, ctx } = this
    const { ok } = await app.fullQiniu.delete(path.basename(url))
    if (ok) {
      return ctx.model.Billboard
        .deleteOne({ _id })
        .then(({ deletedCount }) => {
          if (deletedCount === 1) {
            return { code: 2000, msg: '删除广告牌成功' }
          }
          return { code: 3000, msg: '无任何广告牌被删除' }
        })
    }
    return { code: 5000, msg: '七牛云图片删除失败' }
  }

  async updateBillboard({ _id, type, link }) {
    return this.ctx.model.Billboard
      .updateOne({ _id }, { type, link })
      .then(({ nModified }) => {
        if (nModified === 1) {
          return { code: 2000, msg: '更新广告牌成功' }
        }
        return { code: 3000, msg: '无任何广告牌被更新' }
      })
      .catch(err => ({ code: 5000, msg: err.message }))
  }
}

module.exports = BillboardService
