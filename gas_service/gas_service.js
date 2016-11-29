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
var gas_value; //가스수치//
var get_gas_value; //가스수치 얻기//

/** 집안의 private한 정보이기에 다 POST방식으로 한다. **/
//가스값을 저장하는 부분//
router.post('/gas_insert', function(request, response){
    gas_value = request.body.gasvalue; //전송할 메세지를 받는다.//

    console.log('input gas value: '+gas_value);

    UPDATE_func(gas_value, response); //온도값을 저장//
});

//가스값을 요청하는 부분//
//앱으로 부터 받는 리퀘스트 부분//
router.post('/get_gas', function(request, response){
    console.log('get gas');
    
    GET_gas_value(response);
});
///////////////////////////
function GET_gas_value(response)
{
    //비동기 순차적으로 수행//
    async.waterfall([
        //Task 1 : 온도와 습도값을 가져온다.//
        function(callback)
        {
            var connection = db_connection_pool(); //DB Connection pool//
            var gas_value = -1;

            connection.query('select sensor_value from sensorservice where sensor_name = "gas_sensor"', function(error, rows, fields){
                if(error) throw error;
                else{
                    for(var i=0; i<rows.length; i++)
                    {
                        console.log('value: '+rows[i].sensor_value);

                        if(i == 0) //온도센서의 경우//
                        {
                            gas_value = rows[i].sensor_value;
                        }
                    }
                }

                callback(null, gas_value);
            });

            connection.end();
        }
    ],
    //Final Task : 얻어온 온도와 습도값을 제공한다.//
    function(callback, gas_value)
    {
        console.log('trans temp_value: '+gas_value);
    
        //전송 json객체를 만든다.//
        var result = 
        {
            'gas_data':gas_value,
        }

        var trans_objeect = 
        {
            'state':'normal',
            'info': result
        }

        var trans_json = JSON.stringify(trans_objeect); //json으로 반환//

        response.send(trans_json);
    });
}
///////////////////////////
function UPDATE_func(gas_value, response)
{
    //비동기 순차적으로 수행//
    async.waterfall([
        //Task 1 : 온도값을 저장//
        function(callback)
        {
            var connection = db_connection_pool(); //DB Connection pool//
            var is_success = false; //처음 실패라 가정//

            var update_data_array = [gas_value]; //배열로 만든다.//

            connection.query('update sensorservice set sensor_value=? where sensor_name="gas_sensor"',update_data_array, function(error, result){
                if(error) throw error;
                else{
                    console.log('update success...');

                    is_success = true; //성공이라 설정//

                    callback(null, is_success); //콜백함수의 인자에 맞추어서 매개변수를 설정//
                }
            });

            connection.end(); //데이터베이스 작업을 한 이후 반드시 닫아준다.//
        }
    ],
    //final Task : 아두이노로 JSON결과 반환//
    function(callback, is_success)
    {
        console.log('update success : ' + is_success);

        if(is_success == true) //데이터 저장 성공//
        {
            //전송 json객체를 만든다.//
            var result = 
            {
                'gas_data':gas_value,
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
                'gas_data':gas_value,
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