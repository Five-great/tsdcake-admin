'use strict';
const router = require('express').Router();
const AV = require('leanengine');
const GoodsList = AV.Object.extend('GoodsList');

// 商品 列表
router.get('/', function (req, res, next) {
    if (req.currentUser) {
        let query = new AV.Query(GoodsList);
        query.descending('createdAt');
        query.limit(50);
        query.find().then(function (results) {
            res.render('goodsList', {
                title: process.env.SITE_NAME + '的商品列表',
                domain: process.env.SITE_URL,
                data_list: results
            });
        }, function (err) {
            if (err.code === 101) {
                res.render('goodsList', {
                    title: process.env.SITE_NAME + '的商品列表',
                    domain: process.env.SITE_URL,
                    data_list: []
                });
            } else {
                next(err);
            }
        }).catch(next);
    } else {
        res.redirect('/');
    }
});


router.get('/delete', function (req, res, next) {
    if (req.currentUser) {
        let query = new AV.Query(GoodsList);
        query.get(req.query.id).then(function (object) {
            object.destroy();
            res.redirect('/goodsList')
        }, function (err) {
        }).catch(next);
    } else {
        res.redirect('/');
    }
});

module.exports = router;