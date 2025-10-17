<?php
header('Content-Type: application/json'); // 确保返回 JSON

$file = $_FILES['file'] ?? null;
if (!$file || !is_uploaded_file($file['tmp_name'])) {
    msg(['code' => 1, 'msg' => '上传数据有误']);
}

$arr = pathinfo($file['name']);
$ext_suffix = strtolower($arr['extension']);
$allow_suffix = ['jpg', 'gif', 'jpeg', 'png'];

if (!in_array($ext_suffix, $allow_suffix)) {
    msg(['code'=> 1, 'msg'=> '上传格式不支持']);
}

$new_filename = time() . rand(100, 1000) . '.' . $ext_suffix;

if (!move_uploaded_file($file['tmp_name'], $new_filename)) {
    msg(['code'=> 1, 'msg'=> '上传失败']);
}

// 上传到阿里图床
uploadToAli($new_filename);

function uploadToAli($file_path) {
    $url = 'https://kfupload.alibaba.com/kupload';
    $data = [
        'scene' => 'aeMessageCenterV2ImageRule',
        'name'  => $file_path,
        'file'  => new CURLFile(realpath($file_path))
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 120);
    curl_setopt($ch, CURLOPT_TIMEOUT, 120);
    $ip = mt_rand(48, 140) . "." . mt_rand(10, 240) . "." . mt_rand(10, 240) . "." . mt_rand(10, 240);
    $hothead = [
        "Accept:application/json",
        "Accept-Encoding:gzip,deflate,sdch",
        "Accept-Language:zh-CN,zh;q=0.8",
        "Connection:close",
        'CLIENT-IP:' . $ip,
        'X-FORWARDED-FOR:' . $ip
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $hothead);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Dalvik/2.1.0 (Linux; U; Android 10; ONEPLUS A5010 Build/QKQ1.191014.012)');
    curl_setopt($ch, CURLOPT_ENCODING, "gzip");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

    $html = curl_exec($ch);
    curl_close($ch);
    @unlink($file_path);

    $json = @json_decode($html, true);

    if ($json && isset($json['code']) && $json['code'] === '0' && isset($json['url'])) {
        msg(['code'=> 0, 'msg'=> $json['url']]);
    } else {
        // 如果阿里接口返回字段不一样，可以在这里调试
        // file_put_contents('debug.txt', $html);
        msg(['code'=> 1, 'msg'=> '上传失败，请重试']);
    }
}

function msg($data){
    exit(json_encode($data));
}
