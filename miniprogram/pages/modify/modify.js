import { promisify } from '../../utils/promise.util'
import { $init, $digest } from '../../utils/common.util'
//const wxUploadFile = promisify(wx.uploadFile)
var app = getApp()
const db = wx.cloud.database()
var util = require('../../utils/util.js')
 
var parm=''
var GoodsData=''

wx.cloud.init({
  env: ''
});

Page({
  /**
   * 页面的初始数据
   */
  data: {
    images: [],
    array: ['书籍', '服装', '电子', '零食', '其他'],
    objectArray: [
      {
        id: 0,
        name: '书籍'
      },
      {
        id: 1,
        name: '服装'
      },
      {
        id: 2,
        name: '电子'
      },
      {
        id: 3,
        name: '零食'
      },
      {
        id: 4,
        name: '其他'
      }
    ],
    index: 0,
    information: [],
    modalHidden: true,
    fileID: [],
  },

  onLoad: function (options) {
    $init(this)
    this.GetDetail(options.id)
    parm = options.id
    console.log("parm:"+parm)
  },

  GetDetail(parm) {
    let that = this
    const db = wx.cloud.database()
    const _ = db.command
    db.collection('goods').where({
      _id: parm
    }).get({
      success(res) {
        console.log('查询结果:', res.data)
        GoodsData = res.data,
        that.setData({
          detail: res.data,
        })
      }
    })
  },

  //图片
  chooseImage(e) {
    wx.chooseImage({
      count: 3,
      sizeType: 'compressed',
      // mode: 'aspectFill',
      sourceType: ['album', 'camera'],
      success: res => {
        const images = this.data.images.concat(res.tempFilePaths)
        this.data.images = images.length <= 3 ? images : images.slice(0, 3)
        $digest(this)
      }
    })
  },

  removeImage(e) {
    const idx = e.target.dataset.idx
    this.data.images.splice(idx, 1)
    $digest(this)
  },

  handleImagePreview(e) {
    const idx = e.target.dataset.idx
    const images = this.data.images
    wx.previewImage({
      current: images[idx],
      urls: images,
    })
  },
   
  //类别选择
  bindPickerChange(e) {

    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      index: e.detail.value
    })
  },
  //表单提交
  formSubmit(e) {
    console.log(e);
    var information = e.detail.value;
    var that = this;
      console.log(parm)
       console.log(GoodsData[0])
   if (information.name == "") {
      information.name = GoodsData[0].name
      console.log("GoodsData[0].name:"+GoodsData[0].name )
    }
   if (information.phone == "") {
     information.phone = GoodsData[0].price
     console.log("GoodsData[0].price:" + GoodsData[0].price)
    }
    if (information.info == "") {
      information.info = GoodsData[0].info
      console.log("information.info:" + information.info)
    }

    if (this.data.images.length != 0) {
      wx.showLoading({
        title: '上传中...',
      })
      const filePath = this.data.images, cloudPath = [];
      filePath.forEach((item, i) => {
        cloudPath.push(util.vcode(new Date()) + '_' + i + filePath[i].match(/\.[^.]+?$/)[0])
      })
      console.log(cloudPath)
      filePath.forEach((item, i) => {
        wx.cloud.uploadFile({
          cloudPath: cloudPath[i],
          filePath: filePath[i],
          success: res => {
            console.log('[上传图片] 成功:', cloudPath[i], res)
            that.data.fileID.push(res.fileID)

            app.globalData.cloudPath = cloudPath
            app.globalData.imagePath = filePath
            if (i === filePath.length - 1) {
              var toSubmit = {
                name: information.name,
                price: information.phone,
                category: that.data.array[that.data.index],
                time: new Date(),
                info: information.info,
                image: that.data.fileID
              };

              console.log(toSubmit);
              
              db.collection('goods').doc(parm).update({
                data: toSubmit,
                success: res => {
                  wx.showToast({
                    title: '提交成功',
                    icon: 'success'
                  })
                  console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
                  setTimeout(() => {
                    wx.switchTab({
                      url: '../index/index',
                    })
                  }, 200)

                },
                fail: err => {
                  wx.showToast({
                    icon: 'none',
                    title: '提交失败'
                  })
                  console.error('[数据库] [新增记录] 失败：', err)
                }
              })
            }
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
          }
        })
      })
      wx.hideLoading()
    }
    else{
      db.collection('goods').doc(parm).update({
        data:{
        name: information.name,
        price: information.phone,
        category: that.data.array[that.data.index],
        time: new Date(),
        info: information.info
        },
        success: res => {
          wx.showToast({
            title: '修改成功',
            icon: 'success'
          })
          console.log('[数据库] [修改记录] 成功，记录 _id: ', res._id)
          setTimeout(() => {
            wx.switchTab({
              url: '../index/index',
            })
          }, 200)

        },
        fail: err => {
          wx.showToast({
            icon: 'none',
            title: '修改失败'
          })
          console.error('[数据库] [修改记录] 失败：', err)
        }
      })
    }

    modalHidden: true;
  },
})