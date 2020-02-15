const aws = require("aws-sdk");
const {promisify} = require('util');
const fs = require('fs');
const os = require('os');
const uuidv4 = require('uuid/v4');
const img = require('imagemagic');

aws.config.update({region: 'us-east-1'});
const s3 = aws.s3();

const resizeAsync = promisify(im.resize);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink)

exports.handler = async(event) => {
    let files = event.Records.map( async(record)=>{
        let bucket = record.s3.bucket.name;
        let fileName = record.s3.object.key;

        // get file from s3
        var params = {
            Bucket: bucket,
            key: fileName
        }
        let inputData = await s3.getObject(params).Promise();
        
        // resize the file
        let tmpFile = os.tmpDir() + '/' + uuidv4() +".jpg";
        let resizeArgs = {
            srcData: inputData,
            dstPath: tmpFile,
            width: 150
        };
        await resizeAsync(resizeArgs);
        
        // read the resized file
       let resizeData = await readFileAsync(tmpFile);

        // upload the enw file to s3
        let targetFileName = fileName.substring(0, fileName.indexOf(".")) + '-small.jpg';
        let targetParams = {
            Bucket: bucket + "-dest",
            key: targetFileName,
            Body: new Buffer(resizeData),
            ContentType: 'image/png'
        }
        await s3.putObject(targetParams).promise();


        return await unlinkAsync(tmpFile);
    })


    await Promise.all(files);
    console.log("done")
    return "done";
}