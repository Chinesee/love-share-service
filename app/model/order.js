'use strict'

module.exports = app => {
  const mongoose = app.mongoose
  const Schema = mongoose.Schema

  const OrderSchema = new Schema({
    goods_list: [new Schema({
      amount: { type: Number, required: true },
      goods: { type: Schema.Types.ObjectId, ref: 'Goods' },
    })],
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
        goods: { type: Schema.Types.ObjectId, ref: 'Goods' },
      })],
    }, {
      timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    })],
    status: {
      type: Number,
      enum: [1, 2, 3], // 1-进行中, 2-已完成, 3-派送中
      default: 1,
    },
    step: {
      type: Number,
      default: 1,
    },
  })

  OrderSchema.set('timestamps', {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  })

  return mongoose.model('Order', OrderSchema)
}
