'use strict'

const sendToWormhole = require('stream-wormhole')
const Controller = require('egg').Controller

class AdminController extends Controller {
  /* POST
   * 创建管理员
   */
  async createAdmin() {
    const { ctx, service } = this
    ctx.validate({
      account: 'string',
      password: 'string',
      nickname: 'string',
      real_name: 'string',
      permissions: { type: 'array', itemType: 'object' },
      avatar_url: 'string',
      gender: [0, 1],
      email: 'email?',
    })
    const res = await service.admin.createAdmin(ctx.request.body)
    ctx.reply(res)
  }

  /* POST
   * 通过邀请码创建管理员
   */
  async createAdminByInvitation() {
    const { ctx, service } = this
    ctx.validate({
      account: 'string',
      password: 'string',
      nickname: 'string',
      real_name: 'string',
      permissions: { type: 'array', itemType: 'object' },
      avatar_url: 'string',
      gender: [0, 1],
      email: 'email?',
    })
    const res = await service.admin.createAdmin(ctx.request.body)
    ctx.reply(res)
  }

  /* PUT
   * 更新管理员
   */
  async updateAdmin() {
    const { ctx, service } = this
    ctx.validate({ admin_id: 'string' })
    const res = await service.admin.updateAdmin(ctx.request.body)
    ctx.reply(res)
  }

  /* POST
   * 管理员登录
   */
  async signIn() {
    const { ctx, service } = this
    ctx.validate({
      account: 'string',
      password: 'string',
      position: 'object',
      device: 'string',
    })
    const res = await service.admin.signIn(ctx.request.body)
    ctx.reply(res)
  }

  /* GET
   * 获取管理员列表
   */
  async getAdminList() {
    const { ctx, service } = this
    const res = await service.admin.getAdminList()
    ctx.reply(res)
  }

  /* POST
   * 重置管理员密码
   */
  async resetPassword() {
    const { ctx, service } = this
    const res = await service.admin.resetPassword(
      ctx.state.user.id,
      ctx.request.body
    )
    ctx.reply(res)
  }

  /* GET
   * 获取管理员信息
   */
  async getAdminInfo() {
    const { ctx, service } = this
    const res = await service.admin.getAdminInfo(ctx.state.user.id)
    ctx.reply(res)
  }

  /* GET
   * 获取其他管理员的详细
   */
  async getAdminDetail() {
    const { ctx, service } = this
    ctx.validate({ admin_id: 'string' }, ctx.query)
    const res = await service.admin.getAdminDetail(ctx.query.admin_id)
    ctx.reply(res)
  }

  /* POST
   * 上传头像
   */
  async uploadAvatar() {
    const { ctx, service } = this
    const stream = await ctx.getFileStream()
    try {
      const res = await service.admin.uploadAvatar(stream)
      ctx.reply(res)
    } catch (err) {
      await sendToWormhole(stream)
    }
  }

  /* POST
   * 替换管理员的头像
   */
  async replaceAvatar() {
    const { ctx, service } = this
    ctx.validate({
      admin_id: 'string',
      avatar_url: 'string',
    })
    const res = await service.admin.replaceAvatar(ctx.request.body)
    ctx.reply(res)
  }

  /* GET
   * 获取登录日志信息
   */
  async getSignLog() {
    const { ctx, service } = this
    const res = await service.admin.getSignLog(ctx.state.user.id, ctx.query)
    ctx.reply(res)
  }

  /* PUT
   * 绑定用户
   */
  async bindUser() {
    const { ctx, service } = this
    ctx.validate({ account: 'string' })
    const res = await service.admin.bindUser(ctx.state.user.id, ctx.request.body)
    ctx.reply(res)
  }

  /* PUT
   * 取消绑定用户
   */
  async unbindUser() {
    const { ctx, service } = this
    const res = await service.admin.unbindUser(ctx.state.user.id)
    ctx.reply(res)
  }

  /* PUT
   * 修改密码
   */
  async updatePassword() {
    const { ctx, service } = this
    ctx.validate({ old_pwd: 'string', new_pwd: 'string' })
    const res = await service.admin.updatePassword(ctx.state.user.id, ctx.request.body)
    ctx.reply(res)
  }

  /* PUT
   * 修改锁屏密码
   */
  async updateLockPassword() {
    const { ctx, service } = this
    ctx.validate({ password: 'string', lock_password: 'string' })
    const res = await service.admin.updateLockPassword(ctx.state.user.id, ctx.request.body)
    ctx.reply(res)
  }
}

module.exports = AdminController
