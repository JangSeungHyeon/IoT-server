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
var temperature_value; //온도값//

router.post('/temp_insert', function(request, response){
    temperature_value = request.body.tempvalue; //전송할 메세지를 받는다.//

    console.log('input temp value: '+temperature_value);

    INSERT_func(temperature_value, response); //온도값을 저장//
});
////////////////////////////
function INSERT_func(temperature_value, response)
{
    //비동기 순차적으로 수행//
    async.waterfall([
        //Task 1 : 온도값을 저장//
        function(callback)
        {
            var connection = db_connection_pool(); //DB Connection pool//
            var is_success = false; //처음 실패라 가정//

            var update_data_array = [temperature_value]; //배열로 만든다.//

            connection.query('update sensorservice set sensor_value=? where sensor_name="temperature_sensor"',update_data_array, function(error, result){
                if(error) throw error;
                else{
                    console.log('update success...');

                    is_success = true; //성공이라 설정//

                    callback(null, is_success, temperature_value); //콜백함수의 인자에 맞추어서 매개변수를 설정//
                }
            });

            connection.end(); //데이터베이스 작업을 한 이후 반드시 닫아준다.//
        }
    ],
    //final Task : 아두이노로 JSON결과 반환//
    function(callback, is_success, temperature_value)
    {
        console.log('insert success : ' + is_success);

        if(is_success == true) //파일저장 성공//
        {
            //전송 json객체를 만든다.//
            var result = 
            {
                'temp_data':temperature_value
            }

            var trans_objeect = 
            {
                'is_success':is_success,
                'info': result
            }
        }

        else if(is_success == false) //파일저장 실패//
        {
            //전송 json객체를 만든다.//
            var result = 
            {
                'temp_data':temperature_value
            }

            var trans_objeect = 
            {
                'is_success':is_success,
                'info': result
            }   
        }

        var trans_json = JSON.stringify(trans_objeect); //json으로 반환//

        response.send(trans_json);
    });
}
////////////////////////////
function db_connection_pool()
{
    //데이터베이스 정보 설정//
    var connection = mysql.createConnection({
        host : 'localhost', //db ip address//
        port : 3306, //db port number//
        user : 'root', //db id//
        password : '3315', //db password//
        database : 'home' //db schema name//
    });

    //mysql connection//
    connection.connect(function(err){
        if(err){
            console.error('mysql connection error');
            console.error(err);
        }

        else{
            console.log('connection success...');
        }
    });

    return connection;
}
////////////////////////////
module.exports = router; //모듈 적용//