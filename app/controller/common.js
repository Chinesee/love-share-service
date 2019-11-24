'use strict'

const Controller = require('egg').Controller

class CommonController extends Controller {
  /* POST
   * 检测手机号是否已被注册
   */
  async checkPhoneNumber() {
    const { ctx, service } = this
    const res = await service.common.checkPhoneNumber(ctx.request.body.phone)

    ctx.body = res
    ctx.status = 200
  }

  /* POST
   * 获取用户注册验证码
   */
  async getVerificationCode() {
    const { app, ctx, service } = this

    const errors = app.validator.validate(
      { phone: 'string' },
      ctx.request.body
    )

    if (errors) {
      ctx.body = errors
      ctx.status = 400
    } else {
      const res = await service.common.getVerificationCode(ctx.request.body.phone)
      ctx.body = res
      ctx.status = 200
    }
  }
}

module.exports = CommonController
