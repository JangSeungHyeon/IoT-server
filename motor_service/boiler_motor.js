var express = require('express');
var mysql = require('mysql'); //데이터베이스 연결 모듈//
var bodyParser = require('body-parser'); //POST방식//
var async = require('async'); //비동기 순차처리를 위한 모듈//

//라우터별로 분리하기 위해 express의 라우터 기능 사용//
var router = express.Router();

//POST설정//
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({     //to support URL-encoded bodies (url-encoded방식)//
    extended: true
}));

//입력변수//
var motor_on_off_flag;

/** 집안의 private한 정보이기에 다 POST방식으로 한다. **/
//가스값을 저장하는 부분//
router.post('/boiler_on', function(request, response){
    motor_on_off_flag = request.body.flag;

    console.log('flag: ' + motor_on_off_flag);

    response.send('motor on');
});

//가스값을 요청하는 부분//
//앱으로 부터 받는 리퀘스트 부분//
router.post('/boiler_off', function(request, response){
    motor_on_off_flag = request.body.flag;

    console.log('flag: ' + motor_on_off_flag);

    response.send('motor off');
});
////////////////////////////
////////////////////////////
module.exports = router; //모듈 적용//