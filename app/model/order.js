'use strict'

module.exports = ({ mongoose, timestamps }) => {
  const Schema = mongoose.Schema

  const OrderSchema = new Schema({
    payment: { type: String, required: true },
    address: { type: Object, required: true },
    total_price: { type: Number, required: true },
    actual_price: { type: Number, required: true },
    buyer: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    sub_order: [new Schema({
      goods_list: [new Schema({
        amount: { type: Number, required: true },
        note: { type: String, maxlength: 100 },
        goods: { type: Schema.Types.ObjectId, required: true, ref: 'Goods' },
      })],
      total_price: { type: Number, required: true },
      actual_price: { type: Number, required: true },
      delivery_charge: { type: Number, required: true },
      status: {
        type: Number,
        enum: [1, 2, 3, 4], // 1-进行中, 2-已完成, 3-派送中, 4-已取消, 5-未付款
        default: 1,
      },
    }, { timestamps })],
    status: {
      type: Number,
      enum: [1, 2, 3, 4], // 1-进行中, 2-已完成, 3-派送中, 4-已取消
      default: 1,
    },
    split_info: new Schema({
      is_split: { type: Boolean, default: false },
      reason: String,
    }, { timestamps }),
    step: {
      type: Number,
      default: 1,
    },
  }, { timestamps })

  return mongoose.model('Order', OrderSchema)
}
