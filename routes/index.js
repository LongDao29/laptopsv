var express = require('express');
var router = express.Router();

var dbConnect='mongodb+srv://admin:admin@cluster0.gfyr4.mongodb.net/tinder?retryWrites=true&w=majority';

const  mongoose =require('mongoose');
mongoose.connect(dbConnect,{useNewUrlParser:true,useUnifiedTopology:true});

var multer=require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
        var chuoi=file.originalname;
        var duoi=file.originalname.slice(chuoi.length-5,chuoi.length);
        if(duoi==='.jpeg'){
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
            cb(null, file.fieldname + '-' + uniqueSuffix+duoi)
        }else {
            cb('khong phải file jpeg',null)
        }
    }
})
var upload1=multer({
    storage:storage,limits: {
        fileSize: 1024*1024,
        files:3,
    }
}).array('avatar11')

require('dotenv').config()
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs')

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY
const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
})

function uploadFile(file) {
    if(file !== undefined){
        const fileStream = fs.createReadStream(file.path)

        const uploadParams = {
            Bucket: bucketName,
            Body: fileStream,
            Key: file.filename,
        }

        return s3.upload(uploadParams).promise()
    }
}

function getFileStream(fileKey){
    const downloadParams = {
        Key: fileKey,
        Bucket: bucketName
    }

    return s3.getObject(downloadParams).createReadStream()
}

function deleteFile(fileArray){
    var deleteParam = {
        Bucket: bucketName,
        Delete: {
            Objects: fileArray
        }
    };
    s3.deleteObjects(deleteParam, function(err, data) {
        if (err) console.log(err, err.stack);
        else console.log('delete', data);
    });
}

async function getProductFromCart(array){
    let productList = []
    for (let i=0;i<array.length;i++){
        await db.model('products', product).find({id_product: array[i]}, (err, product) =>{
            productList.push(product[0])
        })
    }
    return productList
}

const  db=mongoose.connection;
db.on('error',console.error.bind(console,'connection error'));
db.once('open',function (){
  console.log('connected')
});
var product = new mongoose.Schema(
    {
        id_product:String,
        name_product:String,
        price_product:String,
        brand_product: String,
        image1: String,
        image2: String,
        image3: String,
        display: String,
        os: String,
        front_camera: String,
        behind_camera: String,
        cpu: String,
        ram: String,
        rom: String,
        sim: String,
        pin: String,
        quantity_stock: Number,
        quantity_buy: Number,
    }
)

var student = new mongoose.Schema({
    maLop: String,
    tenLop: String,
    khoaHoc: String,
    maSV: String,
    tenSV: String,
    maMon: String,
    diem: Number,
})

var user2 = new mongoose.Schema({
    phone_number: String,
    password: String,
    full_name: String,
    address: String,
    cart: [],
})

var admin = new mongoose.Schema({
    name_id: String,
    password: String,
})

var bill = new mongoose.Schema( {
    id_bill: String,
    phone_number: String,
    item_list: [{
        id_product:String,
        name_product:String,
        price_product:String,
        brand_product: String,
        image1: String,
        image2: String,
        image3: String,
        display: String,
        os: String,
        front_camera: String,
        behind_camera: String,
        cpu: String,
        ram: String,
        rom: String,
        sim: String,
        pin: String,
        quantity_stock: Number,
        quantity_buy: Number,
    }],
    total_value: String,
    status: String,
})

var baseJson = {
    errorCode : undefined,
    errorMessage : undefined,
    data : undefined
}

router.get('/', function(req, res, next) {
    res.render('login',{title:'Product Manager'})
});

router.post('/loginAdmin',function (req, res) {
    db.model('admins', admin).find({name_id: req.body.name_id}, (err, admin) =>{
        if(err){
            console.log(err)
        }else {
            if(admin.length > 0){
                if(admin[0].password === req.body.password){
                    console.log('Đăng nhập thành công!')
                    res.redirect('../index')
                }else {
                    console.log('Sai mật khẩu!')
                    res.redirect('../')
                }
            }else{
                console.log('ID không tồn tại')
                res.redirect('../')
            }
        }
    });
})

router.get('/index', function(req, res, next) {
    const type = req.query.type;
    if(type==='json') {
        res.send(product)
    }
    var userConnect1=db.model('products',product);
    userConnect1.find({},function (err,products) {
        if(err){
            res.render('index',{title:'Express :err'+err})
        }
        db.model('users',user2).find({},function (err,users) {
            if(err){
                res.render('index',{title:'Express :err'+err})
            }
            db.model('bills',bill).find({},function (err,bills) {
                if(err){
                    res.render('index',{title:'Express :err'+err})
                }
                console.log(bills)
                res.render('index',{title:'Product Manager', products: products, users: users, bills: bills})
            })
        })
    })
});

router.get('*/images/:key', (req, res) => {
    const key = req.params.key
    if(key !== ''){
        const readStream = getFileStream(key)

        readStream.pipe(res)
    }
})

router.post('/',async (req,res) => {
    var userConnect=db.model('product', product);
    upload1(req, res, async function (err){
        if(err){
            if(err==='MulterError: Too many files'){
                return res.send("Tối da 3 file !!!")
            }
            if(err==='MulterError: File too large'){
                return res.send("Tối da 200KB !!!")
            }
            console.log(err)
            return;
        }else {
            for(let i=0;i<req.files.length;i++){
                const file = req.files[i];
                await uploadFile(file)
            }
            userConnect({
                id_product:req.body.id_product,
                name_product:req.body.name_product,
                price_product:req.body.price_product,
                brand_product:req.body.brand_product,
                display:req.body.display,
                os:req.body.os,
                front_camera:req.body.front_camera,
                behind_camera:req.body.behind_camera,
                cpu:req.body.cpu,
                ram:req.body.ram,
                rom:req.body.rom,
                sim:req.body.sim,
                pin:req.body.pin,
                quantity_stock: req.body.quantity_stock,
                quantity_buy: 0,
                image1: req.files[0] && req.files[0].filename ? req.files[0].filename : '',
                image2: req.files[1] && req.files[1].filename ? req.files[1].filename : '',
                image3: req.files[2] && req.files[2].filename ? req.files[2].filename : '',
            }).save(function (err) {
                if(err){
                    res.render('index',{title:'Express :err'})
                }else {
                    db.model('products',product).find({},function (err,products) {
                        if(err){
                            res.render('index',{title:'Express :err'+err})
                        }
                        db.model('users',user2).find({},function (err,users) {
                            if(err){
                                res.render('index',{title:'Express :err'+err})
                            }
                            db.model('bills',bill).find({},function (err,bills) {
                                if(err){
                                    res.render('index',{title:'Express :err'+err})
                                }
                                console.log(bills)
                                res.render('index',{title:'Product Manager', products: products, users: users, bills: bills})
                            })
                        })
                    })
                }
            })
        }
    });
})

router.post('/login',function (req, res) {
    var connectUsers = db.model('users', user2);
    console.log(req.body.phone_number)
    connectUsers.find({phone_number: req.body.phone_number}, (err, user2) =>{
        if(err){
            console.log(err)
        }else {
            console.log(user2)
            let data = {'fullname': user2.name, 'phone_number': user2.phone_number, 'password': user2.password, 'address': user2.address}
            if(user2.length > 0){
                if(user2[0].password === req.body.password){
                    baseJson.errorCode = '200'
                    baseJson.errorMessage = 'Login Success'
                    baseJson.data = data
                }else {
                    baseJson.errorCode = '200'
                    baseJson.errorMessage = 'Wrong Password'
                    baseJson.data = []
                }
            }else{
                baseJson.errorCode = '200'
                baseJson.errorMessage = 'Account Not Exists'
                baseJson.data =[]
            }
        }
        res.json(baseJson);
    });
})

router.post('/createUser',function (req, res) {
    var connectUsers = db.model('users', user2);
    console.log(req.body.phone_number)
    connectUsers.find({phone_number: req.body.phone_number}, (err, user2) =>{
        if(err){
           console.log(err)
        }else {
            console.log(user2)
           if(user2.length > 0){
               console.log('Acc Exists')
               baseJson.errorCode = '200'
               baseJson.errorMessage = 'Account Exists'
               baseJson.data =[]
               res.json(baseJson);
           }else{
               connectUsers({
                   full_name: req.body.full_name,
                   phone_number: req.body.phone_number,
                   password: req.body.password,
                   address: req.body.address,
               }).save(function (error) {
                   if (error) {
                       baseJson.errorCode = '400'
                       baseJson.errorMessage = 'Fail'
                       baseJson.data =[]
                       res.json(baseJson);
                   } else {
                       baseJson.errorCode = '200'
                       baseJson.errorMessage = 'OK'
                       baseJson.data = req.body
                       res.json(baseJson);
                   }
               })
           }
        }
    });
})

router.get('/getProducts', (req, res) =>{
    db.model('products', product).find({}, (err, users) =>{
        if(err){
            baseJson.errorCode = 403
            baseJson.errorMessage = '403 Forbidden'
            baseJson.data = []
        }else {
            baseJson.errorCode = 200
            baseJson.errorMessage = 'OK'
            baseJson.data = users
        }
        res.send(baseJson);
    });
});

router.get('/getProducts/:id', (req, res) =>{
    db.model('products', product).findOne({id_product: req.params.id}, (err, users) =>{
        if(err){
            baseJson.errorCode = 403
            baseJson.errorMessage = '403 Forbidden'
            baseJson.data = []
        }else {
            baseJson.errorCode = 200
            baseJson.errorMessage = 'OK'
            baseJson.data = users
        }
        res.send(baseJson);
    });
});

router.post('/getCart', (req, res) =>{
    db.model('users', user2).find({phone_number: req.body.phone_number}, async (err, user) =>{
        if(err){
            console.log(err)
            baseJson.errorCode = '400'
            baseJson.errorMessage = 'Fail'
            baseJson.data = []
        }else {
            console.log(user[0].cart)
            const productList = await getProductFromCart(user[0].cart)
            console.log(productList)
            baseJson.errorCode = 200
            baseJson.errorMessage = 'OK'
            baseJson.data = productList
        }
        res.send(baseJson)
    });
});

router.get('/deleteProduct/:id',function (req,res) {

    db.model('products', product).findById(req.params.id,function (err,data) {
        if(err){
            console.log(err)
        }else {
            const arrayImage = [{Key: data.image1}, {Key: data.image2}, {Key: data.image3}]
            deleteFile(arrayImage)
        }
    })
    db.model('products', product).deleteOne({ _id: req.params.id}, function (err) {
        if (err) {
            console.log('Lỗi')
        }
            res.redirect('../index')
    });
})

router.get('/deleteUser/:id',function (req,res) {

    db.model('users',user2).deleteOne({ _id: req.params.id}, function (err) {
        if (err) {
            console.log('Lỗi')
        }
        res.redirect('../index')
    });
})


router.get('/updateProduct/:id',function (req,res) {
    db.model('products', product).findById(req.params.id,function (err,data) {
        if(err){
            console.log(err)
        }else {
            res.render("updateProduct",{dulieu: data})
        }
    })
})

router.get('/getUserDetails/:id',function (req,res) {
    db.model('users', user2).findById(req.params.id,async function (err,data) {
        if(err){
            console.log(err)
        }else {
            console.log(data.cart)
            const productList = await getProductFromCart(data.cart)
            console.log(productList)
            res.render("userDetails",{data: data, products: productList})
        }
    })
})

router.post('/updateProduct',function (req,res) {
    var userConnect=db.model('products', product);
    upload1(req, res, function (err){
        if(err){
            console.log(err)
        }else {
            userConnect.findOneAndUpdate({_id:req.body._id},{
                        id_product:req.body.id_product,
                        name_product:req.body.name_product,
                        price_product:req.body.price_product,
                        brand_product:req.body.brand_product,
                        display:req.body.display,
                        os:req.body.os,
                        front_camera:req.body.front_camera,
                        behind_camera:req.body.behind_camera,
                        cpu:req.body.cpu,
                        ram:req.body.ram,
                        rom:req.body.rom,
                        sim:req.body.sim,
                        pin:req.body.pin,
                        quantity_stock: req.body.quantity_stock,
            },function (err) {
                    if(err){
                        console.log(err)
                    }else {
                        res.redirect('/index')
                    }
                })
        }
    });
})

router.get('/getUser/:phone_number', (req, res) =>{
    var connectUsers = db.model('users', user2);
    var baseJson = {
        errorCode: undefined,
        errorMessage: undefined,
        data: undefined,
    }
    connectUsers.findOne({phone_number:req.params.phone_number}, (err, users) =>{
        if(err){
            baseJson.errorCode = 403
            baseJson.errorMessage = '403 Forbidden'
            baseJson.data = []
        }else {
            baseJson.errorCode = 200
            baseJson.errorMessage = 'OK'
            baseJson.data = users
        }
        res.send(baseJson);
    });
});

router.post('/updateUser',function (req,res) {
    var userConnect=db.model('users', user2);
    userConnect.findOneAndUpdate({_id:req.body._id},{
        full_name:req.body.full_name,
        phone_number:req.body.phone_number,
        password:req.body.password,
        address:req.body.address,
    },function (err) {
        if(err){
            console.log(err)
        }else {
            res.redirect('/index')
        }
    })
})

router.post('/updateUserClient',function (req,res) {
    db.model('users', user2).findOneAndUpdate({phone_number:req.body.phone_number},{
        full_name:req.body.full_name,
        phone_number:req.body.phone_number,
        password:req.body.password,
        address:req.body.address,
    },function (err) {
        let data = {
            'full_name': req.body.full_name,
            'phone_number': req.body.phone_number,
            'password': req.body.password,
            'address': req.body.address}
        console.log(data)
        if(err){
            console.log(err)
            baseJson.errorCode = '400'
            baseJson.errorMessage = 'Fail'
            baseJson.data = []
        }else {
            baseJson.errorCode = '200'
            baseJson.errorMessage = 'OK'
            baseJson.data = data
        }
        res.send(baseJson)
    })
})

router.post('/addProductToCart', function (req,res){
    var userConnect=db.model('users', user2);
    let tempCart = []
    userConnect.find({phone_number: req.body.phone_number,}, (err, user2) =>{
        tempCart = user2[0].cart
        if(tempCart.indexOf(req.body.id_product) === -1){
            tempCart.push(req.body.id_product)
        }else{
            baseJson.errorCode = '200'
            baseJson.errorMessage = 'Exist'
            res.send(baseJson)
            return
        }
        userConnect.findOneAndUpdate({phone_number:req.body.phone_number},{
            cart: tempCart,
        },function (err) {
            if(err){
                console.log(err)
                baseJson.errorCode = '400'
                baseJson.errorMessage = 'Fail'
            }else {
                baseJson.errorCode = '200'
                baseJson.errorMessage = 'OK'
            }
            res.send(baseJson)
        })
    })
})

router.post('/removeProductFromCart', function (req,res){
    var userConnect=db.model('users', user2);
    let tempCart = []
    userConnect.find({phone_number: req.body.phone_number,}, (err, user2) =>{
        tempCart = user2[0].cart
        const index = tempCart.indexOf(req.body.id_product);
        if (index > -1) {
            tempCart.splice(index, 1);
        }
        console.log(tempCart)
        userConnect.findOneAndUpdate({phone_number:req.body.phone_number},{
            cart: tempCart,
        },function (err) {
            if(err){
                console.log(err)
                baseJson.errorCode = '400'
                baseJson.errorMessage = 'Fail'
            }else {
                baseJson.errorCode = '200'
                baseJson.errorMessage = 'OK'
            }
            res.send(baseJson)
        })
    })
})

router.post('/addBill', function (req,res){
    var billConnect=db.model('bills', bill);
    billConnect({
        id_bill: req.body.id_bill,
        phone_number: req.body.phone_number,
        item_list: req.body.item_list,
        total_value: req.body.total_value,
        status: req.body.status,
    }).save(function (error) {
        if (error) {
            console.log(error)
            baseJson.errorCode = '400'
            baseJson.errorMessage = 'Fail'
            baseJson.data =[]
            res.json(baseJson);
        } else {
            db.model('users', user2).findOneAndUpdate({phone_number:req.body.phone_number},{
                cart: [],
            },function (err) {
                if(err){
                    console.log(err)
                    baseJson.errorCode = '400'
                    baseJson.errorMessage = 'Fail'
                }else {
                    baseJson.errorCode = '200'
                    baseJson.errorMessage = 'OK'
                    baseJson.data = req.body
                }
                res.send(baseJson)
            })
        }
    })
})

router.get('/getBills', (req, res) =>{
    db.model('bills', bill).find({}, (err, bills) =>{
        if(err){
            baseJson.errorCode = 403
            baseJson.errorMessage = '403 Forbidden'
            baseJson.data = []
        }else {
            baseJson.errorCode = 200
            baseJson.errorMessage = 'OK'
            baseJson.data = bills
        }
        res.send(baseJson);
    });
});

router.get('/getBills/:phone_number', (req, res) =>{
    db.model('bills', bill).find({phone_number: req.params.phone_number}, (err, bills) =>{
        if(err){
            baseJson.errorCode = 403
            baseJson.errorMessage = '403 Forbidden'
            baseJson.data = []
        }else {
            baseJson.errorCode = 200
            baseJson.errorMessage = 'OK'
            baseJson.data = bills
        }
        res.send(baseJson);
    });
});

router.get('/getBillDetails/:id',function (req,res) {
    db.model('bills', bill).findById(req.params.id, function (err,data) {
        if(err){
            console.log(err)
        }else {
            res.render("billDetails",{data: data.item_list, total_value: data.total_value})
        }
    })
})

router.get('/cancleBill/:id',function (req,res) {
    var userConnect=db.model('bills', bill);
    userConnect.remove({_id:req.params.id},{
        status: 'Đã Hủy'
    },function (err) {
        if(err){
            console.log(err)
        }else {
            res.redirect('/index')
        }
    })
})

router.get('/confirmBill/:id',function (req,res) {
    var userConnect=db.model('bills', bill);
    userConnect.findOneAndUpdate({_id:req.params.id},{
        status: 'Chờ Giao Hàng'
    },function (err) {
        if(err){
            console.log(err)
        }else {
            res.redirect('/index')
        }
    })
})

router.get('/deliveryBill/:id',function (req,res) {
    var userConnect=db.model('bills', bill);
    userConnect.findOneAndUpdate({_id:req.params.id},{
        status: 'Đang Giao Hàng'
    },function (err) {
        if(err){
            console.log(err)
        }else {
            res.redirect('/index')
        }
    })
})

router.get('/doneBill/:id',function (req,res) {
    var userConnect=db.model('bills', bill);
    userConnect.findOneAndUpdate({_id:req.params.id},{
        status: 'Đã Hoàn Thành'
    },function (err) {
        if(err){
            console.log(err)
        }else {
            res.redirect('/index')
        }
    })
})

router.get('/deleteImg3/:id',function (req,res) {

    db.model('products', product).findById(req.params.id,function (err,data) {
        if(err){
            console.log(err)
        }else {
            const arrayImage = [{Key: data.image3}]
            deleteFile(arrayImage)
        }
    })
    db.model('products', product).updateOne({ _id: req.params.id }, {$set: {image3:""}}, { new: true }, (err, doc) => {
        if (!err) { res.redirect('/updateProduct/' + req.params.id); }
        else {
            console.log('Error during record update : ' + err);
        }
    });
})
router.get('/deleteImg2/:id',function (req,res) {

    db.model('products', product).findById(req.params.id,function (err,data) {
        if(err){
            console.log(err)
        }else {
            const arrayImage = [{Key: data.image2}]
            deleteFile(arrayImage)
        }
    })
    db.model('products', product).updateOne({ _id: req.params.id }, {$set: {image2:""}}, { new: true }, (err, doc) => {
        if (!err) { res.redirect('/updateProduct/' + req.params.id); }
        else {
            console.log('Error during record update : ' + err);
        }
    });
})
router.get('/deleteImg1/:id',function (req,res) {

    db.model('products', product).findById(req.params.id,function (err,data) {
        if(err){
            console.log(err)
        }else {
            const arrayImage = [{Key: data.image1}]
            deleteFile(arrayImage)
        }
    })
    db.model('products', product).updateOne({ _id: req.params.id }, {$set: {image1:""}}, { new: true }, (err, doc) => {
        if (!err) { res.redirect('/updateProduct/' + req.params.id); }
        else {
            console.log('Error during record update : ' + err);
        }
    });
})

router.get('/getStudent', (req, res) =>{
    db.model('students', student).find({}, (err, students) =>{
        if(err){
            baseJson.errorCode = 403
            baseJson.errorMessage = '403 Forbidden'
            baseJson.data = []
        }else {
            baseJson.errorCode = 200
            baseJson.errorMessage = 'OK'
            baseJson.data = students
        }
        res.send(baseJson);
    });
});

router.post('/createStudent',function (req, res) {
    var baseJson2 = {
    errorCode : undefined,
    errorMessage : undefined,
}
    var connectStu = db.model('students', student);
                connectStu({
                    maLop: req.body.maLop,
                    tenLop: req.body.tenLop,
                    khoaHoc: req.body.khoaHoc,
                    maSV: req.body.maSV,
                    tenSV: req.body.tenSV,
                    maMon: req.body.maMon,
                    diem: req.body.diem,
                }).save(function (error) {
                    if (error) {
                        baseJson2.errorCode = 400
                        baseJson2.errorMessage = 'Fail'
                  
                        res.json(baseJson2);
                    } else {
                        baseJson2.errorCode = 200
                        baseJson2.errorMessage = 'OK'
                 
                        res.json(baseJson2);
                    }
                })
})
// router.post('/timkiem',function (req,res){
//     db.model('datas',user).find({sodan:{ $gt:req.body.timkiemMin , $lt:req.body.timkiemMax }},function (err,users) {
//         if(err){
//             console.log("loi")
//         }else {
//             res.render('index',{title:'Express :Success',users:users})
//
//         }
//     })
// })

// router.get('/getUserList', (req, res) =>{
//     var connectUsers = db.model('users', user2);
//     var baseJson = {
//         errorCode: undefined,
//         errorMessage: undefined,
//         data: undefined,
//     }
//     connectUsers.find({}, (err, users) =>{
//         if(err){
//             baseJson.errorCode = 403
//             baseJson.errorMessage = '403 Forbidden'
//             baseJson.data = []
//         }else {
//             baseJson.errorCode = 200
//             baseJson.errorMessage = 'OK'
//             baseJson.data = user2
//         }
//         res.send(baseJson);
//     });
// });

module.exports = router;
