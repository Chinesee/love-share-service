'use strict'

module.exports = app => {
  const { router, controller, middleware } = app
  const { get, post, put, delete: dele } = router
  const { auth } = middleware
  const {
    admin, user, goods, order, school, category,
    notice, begging, guide, billboard, todo, log,
  } = controller

  // 管理员模块
  post(
    '/api/admin/create',
    auth('admin', ['write', 'create']),
    admin.createAdmin)
  post(
    '/api/admin/invitation',
    admin.createAdminByInvitation)
  put(
    '/api/admin/update',
    auth('admin', ['write']),
    admin.updateAdmin)
  post(
    '/api/admin/sign_in',
    admin.signIn)
  get(
    '/api/admin/info',
    auth('admin', ['read']),
    admin.getAdminInfo)
  get(
    '/api/admin/detail',
    auth('admin', ['read']),
    admin.getAdminDetail)
  get(
    '/api/admin/list',
    auth('admin', ['read']),
    admin.getAdminList)
  put(
    '/api/admin/bind_user',
    auth('admin', ['write']),
    admin.bindUser)
  put(
    '/api/admin/unbind_user',
    auth('admin', ['write']),
    admin.unbindUser)
  post(
    '/api/admin/upload_avatar',
    auth('admin', ['write']),
    admin.uploadAvatar)
  put(
    '/api/admin/replace_avatar',
    auth('admin', ['write']),
    admin.replaceAvatar)
  get(
    '/api/admin/sign_log',
    admin.getSignLog)
  put(
    '/api/admin/update_password',
    admin.updatePassword)
  put(
    '/api/admin/update_lock_password',
    admin.updateLockPassword)
  get(
    '/api/admin/todo/list',
    todo.getTodoList)
  post(
    '/api/admin/todo/add',
    todo.addTodo)
  dele(
    '/api/admin/todo/delete',
    todo.deleteTodo)
  put(
    '/api/admin/todo/update',
    todo.updateTodo)
  put(
    '/api/admin/todo/update_type',
    todo.updateTodoType)

  // 通知模块
  get('/api/admin/notice/list', notice.getNoticeListByAdmin)
  get(
    '/api/admin/notice/unread',
    notice.getUnreadNoticesByAdmin)
  post('/api/admin/notice/add', notice.addNoticeByAdmin)
  dele('/api/admin/notice/delete', notice.deleteNoticeByAdmin)
  dele('/api/admin/notice/delete_many', notice.deleteManyNoticesByAdmin)
  put('/api/admin/notice/set_read', notice.setNoticeReadByAdmin)
  put('/api/admin/notice/set_all_read', notice.setAllNoticesReadByAdmin)

  // 用户模块
  get(
    '/api/user/list',
    auth('user', ['read']),
    user.getUserList)
  get(
    '/api/user/detail_by_admin',
    auth('user', ['read']),
    user.getUserDetailByAdmin)
  post(
    '/api/user/daily_statistics',
    auth('user', ['read']),
    user.getUserDailyStatistics)
  put(
    '/api/user/update',
    auth('user', ['write']),
    user.updateUser)
  dele(
    '/api/user/delete',
    auth('user', ['delete']),
    user.deleteUser)
  put(
    '/api/user/account/update',
    auth('user', ['write']),
    user.updateUserAccountInfo)
  get(
    '/api/user/block_list',
    auth('user', ['read']),
    user.getBlockUserList)

  // 商品模块
  get(
    '/api/goods/list/info',
    auth('goods', ['read']),
    goods.getGoodsListInfo)
  get(
    '/api/goods/list/on_sell',
    auth('goods', ['read']),
    goods.getGoodsListOnSell)
  get(
    '/api/goods/list/off_sell',
    auth('goods', ['read']),
    goods.getGoodsListOffSell)
  post(
    '/api/goods/list/by_date_range',
    auth('goods', ['read']),
    goods.getGoodsListByDateRange)
  get(
    '/api/goods/list/by_search_admin',
    auth('goods', ['read']),
    goods.getGoodsListBySearchAdmin)
  get(
    '/api/goods/list/by_school_or_category_admin',
    auth('goods', ['read']),
    goods.getGoodsListBySchoolOrCategoryAdmin)

  // 订单模块
  get(
    '/api/order/list',
    auth('order', ['read']),
    order.getOrderList)
  get(
    '/api/order/list_by_date_range',
    auth('order', ['read']),
    order.getOrderListByDateRange)
  get(
    '/api/order/transaction',
    auth('order', ['read']),
    order.getOrderTransaction)
  get(
    '/api/order/volume',
    auth('order', ['read']),
    order.getOrderVolume)
  get(
    '/api/order/num',
    auth('order', ['read']),
    order.getOrderNum)

  // 资讯模块
  get(
    '/api/guide/list',
    guide.getGuideList)
  post(
    '/api/guide/create',
    auth('guide', ['create']),
    guide.createGuide)
  dele(
    '/api/guide/delete',
    auth('guide', ['delete']),
    guide.deleteGuide)
  post(
    '/api/guide/article/add',
    auth('guide', ['create']),
    guide.addArticle)
  get(
    '/api/guide/article/content',
    guide.getArticle)
  put(
    '/api/guide/article/update',
    auth('guide', ['write']),
    guide.updateArticle)
  dele(
    '/api/guide/article/delete',
    auth('guide', ['delete']),
    guide.deleteArticle)

  // 求购模块
  get(
    '/api/begging/list',
    auth('guide', ['delete']),
    begging.getBeggingList
  )
  post('/api/begging', begging.addBegging)

  // 广告牌模块
  get('/api/billboard/list', billboard.getBillboardList)
  post('/api/billboard/upload', billboard.uploadBillboard)
  dele('/api/billboard/delete', billboard.deleteBillboard)
  put('/api/billboard/update', billboard.updateBillboard)

  // 分类模块
  post(
    '/api/category/add',
    auth('goods', ['create']),
    category.addCategory)
  put(
    '/api/category/update_activation',
    auth('goods', ['delete']),
    category.updateCategoryActivation)
  dele(
    '/api/category/delete',
    auth('goods', ['delete']),
    category.deleteCategory)

  // 学校模块
  post(
    '/api/school/add',
    school.addSchool)
  dele(
    '/api/school/delete',
    auth('order', ['delete']),
    school.deleteSchool)
  put(
    '/api/school/update',
    auth('order', ['write']),
    school.updateSchool)

  // 日志模块
  post('/api/log/add', log.addLog)
  dele('/api/log/delete', log.deleteLog)
  get('/api/log/list', log.getLogList)
}
