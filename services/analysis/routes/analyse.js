/**
 * Filename: analyse.js
 * Author: Ethan Lindeman
 * 
 *      This file contains all the endpoints for the API that handles
 *      all analysis of projects.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Statistic = require('../models/statistic');
const Project = require('../models/project');
const User = require('../models/user');
const ObjectId = mongoose.Types.ObjectId;

const INTERVAL = 0.05;
const TOTAL = 1;

const HOURS = 24;
const HOUR = 60;


/***
     * reduce(array) : array
     * 
     *      The reduce function takes an array of objects that it iterates over in order
     *      to calculate various aspects of statistical data. It will return an object containing the total sum, average, mode, mean, median,
     *      variance, standard deviation
     *      
*/

function reduce(vals) {
    let x = vals[0];
    let len = vals.length;
    for (let i = 1; i < len; i++)
    {
        let y = vals[i];

        let delta = (x.sum/x.count) - (y.sum/y.count);
        let weight = (x.count * y.count)/(x.count + y.count);
        x.diff += y.diff + (delta*delta*weight);
        x.sum += y.sum;
        x.count += y.count;
        x.min = Math.min(x.min, y.min);
        x.max = Math.max(x.max, y.max);
    }

    
    vals.sort(function(a,b){
        return a - b;
    });
    if (len % 2 == 0)
    {
        x.median = (vals[len/2 - 1].sum + vals[len/2].sum) / 2;
    }
    else
    {
        x.median = (vals[(len-1) / 2].sum);
    }

    let mode = [];
    let count = [];
    let max = 0;

    for (let i = 0; i < len; i++)
    {
        let num = vals[i].sum;

        count[num] = (count[num] || 0) + 1;
        if (count[num] > max)
        {
            max = count[num];
        }
    }

    for (c in count)
    {
        if (count.hasOwnProperty(c))
        {
            if (count[c] === max)
            {
                mode.push(Number(c));
            }
        }
    }
    x.mode = mode;
    x.average = x.sum / x.count;
    x.variance = x.diff / x.count;
    x.std_deviation = Math.sqrt(x.variance);
    return x;
}

/***
     * generateHistogramData(array) : array
     * 
     *      The generateHistogramData function takes an array of numbers that it iterates over in order
     *      to convert each number to its nearest multiple of ten. It will return an array containing the converted numbers.
*/

function generateHistogramData(data)
{
    let histogram = [];

    let len = data.length;
    console.log("HISTOGRAM ===========");
    console.log(data);
    for (let i = 0; i < len; i++)
    {
        if (data[i] > 0)
        {
            let num = Math.floor((data[i] * 100)/10) *10;
            histogram.push(num);
        }
        
    }
    console.log(histogram);
    return histogram;
}

/***
     * generateAverageSentimentOverTime(array) : array
     * 
     *      The generateHistogramData function takes an array of objects (where each object has a tweet ID, twitter object and sentiment) that it iterates over in order
     *      to calculate the average sentiment per hour of the day. It will return an array containing the calculated average and list of tweets for that period.
*/


function generateAverageSentimentOverTime(data)
{
    let sum = [];
    let count = [];
    for (let i = 0; i < HOURS; i++)
    {
        sum[i] = 0;
        count[i] = 0;
    }
    let arr = data.map(mapToTime);
    let len = arr.length;
    
    for (let i = 0; i < len; i++)
    {
        if (arr[i].tweetSentiment != -2)
        {
            let ind = Number(arr[i].hour);
            sum[ind] += arr[i].sentiment;
            count[ind] += 1;
        }
        
    }
    let avg = [];
    for (let i = 0; i < HOURS; i++)
    {
        avg[i] = 0;
        if (count[i] != 0)
            avg[i] = sum[i] / count[i];
    }
    let res = [];
    for (let i = 0; i < HOURS; i++)
    {
        if (avg[i] != 0)
        {
            let tweetsList = [];
            for (let j = 0; j < len; j++)
            {
                if (Number(arr[j].hour) == i && arr[j].sentiment != -2)
                    tweetsList.push({
                        tweet : arr[j].tweet,
                        sentiment : arr[j].sentiment
                    });
            }
            res[i] = {
                averageSentiment : avg[i],
                tweets : tweetsList

            };
        }
        else
        {
            res.push({
                averageSentiment: -2,
                tweets : []
            });
        }
    }

    return res;
}

/***
     * getRateOfChange(array) : array
     * 
     *      The getRateOfChange function takes an array of objects (where each object has a averageSentiment and list of tweets) that it iterates over in order
     *      to calculate the change in average sentiment per hour of the day. It will return an array containing the calculated change in average for that period.
*/

function getRateOfChange(data)
{
    let len = data.length;
    console.log(data);
    let change = [];
    for (let i = 0; i < HOURS; i++)
        change[i] = 0;
    let prev = undefined;

    let index = 0;
    for (; index < len; index++)
    {
        if (data[index].averageSentiment != -2) {
            prev = data[index];
            break;
        }
    }
    let count = 1;
    change[0] = 0;
    if (index == 0)
        index = 1;
    for (let i = index; i < len; i++)
    {

        if (data[i].averageSentiment != -2) {
            if (data[i-1].averageSentiment == -2) {
                change[i] = ((data[i].averageSentiment - prev.averageSentiment) / (HOUR * count));
                prev = data[i];
                count++;
            }
            else {
                change[i] = ((data[i].averageSentiment - data[i-1].averageSentiment) / HOUR);
                count = 0;
            }
                
        }
        else
        {
            count++;
        }
        
    }
    console.log(change);
    return change;
}

/***
     * mapToTime(element) : array
     * 
     *      The getRateOfChange function takes an element of an object from the Project data array. 
     *      It will return a new object with the hour, tweet and sentiment
*/

function mapToTime(elem)
{
    let stamp = Number(elem.tweetObject.timestamp_ms);
    let d = new Date(stamp);
    return {
        hour : d.getUTCHours(),
        tweet : elem.tweetObject.text,
        sentiment : elem.tweetSentiment
    };

}
/***
    * request for root (/) page (string id, Number[] scores)
    * 
    * this function receives project id and does statistical analysis on the data
    * the data is then stored in the Database inside the Statistic model
    */

router.post('/', (req, res, next) => {

    

    Project.aggregate([ {$match : {_id : ObjectId(req.body.id)}}, {$project : {"data.tweetSentiment" : 1, "data.tweetObject.text" : 1, "data.tweetObject.timestamp_ms" : 1}}])
    .exec()
    .then(proj => {
        console.log(proj);
     //   res.status(200).json({result: proj});
        let projectData = proj[0].data.filter(function(elem){
            return elem.tweetSentiment > 0;
        });
        let initial = projectData.map(function(elem) {
            return elem.tweetSentiment;
        });

        let hist = generateHistogramData(initial);

        let avg = generateAverageSentimentOverTime(projectData)

        let change = getRateOfChange(avg);
    
        let mapped = initial.map(function(val)
        {
            return {
                sum: val,
                max: val,
                min: val,
                count: 1,
                diff: 0
            }
        });

        let final = reduce(mapped);

        console.log(final);


        const graph = {
            histogram : hist,
            averageOverTime : avg,
            changeOverTime : change
        };



        const stat = new Statistic({
            _id: new mongoose.Types.ObjectId(),
            min : final.min,
            max : final.max,
            std_dev : final.std_deviation, 
            variance : final.variance,
            mean : final.average,
            mode : final.mode,
            median : final.median,
            graphs : graph,
            project : req.body.id
        });

        stat.save()
        .then(result => {
            res.status(200).json({
                success: true,
                message: "Statistics calculated and added",
                result: null
            });
        })
        .catch(err => {
            console.log(err);
            res.status(200).json({
                success: false,
                message: "Failed to add statistics",
                result: null
            });
        });
    })
    .catch(err => {
        console.log(err);
        res.status(200).json({
            success: false,
            message: "Error finding project",
            result: null
        });
    });
    

    
});

/***
    * request for compare (analyse/compare) route (string first, string second)
    * 
    * this function receives an id for two different projects and returns their statistics
    * the data is read from the Database inside the Statistic model
*/

router.post('/compare', (req, res, next) => {
    let idOne = req.body.first;
    let idTwo = req.body.second;

    Statistic.aggregate([{$match : {"project" : ObjectId(idOne)}}, {$sort : { timestamp : -1}}, {$limit : 1}])
    .exec()
    .then(res1 => {
        Statistic.aggregate([{$match : {"project" : ObjectId(idTwo)}}, {$sort : { timestamp : -1}}, {$limit : 1}])
        .exec()
        .then(res2 => {

            const obj = {
                firstProject : res1,
                secondProject : res2
            }
            res.status(200).json({
                success: true,
                message: "Successfully retrieved statistics",
                result: obj
            });
            
        })
        .catch(err2 => {
            res.status(200).json({
                success: false,
                message: "Error finding second project",
                result: null
            })
        });
    })
    .catch(err1 => {
        res.status(200).json({
            success: false,
            messsage: "Error finding first project",
            result: null
        });
    });
});

/***
    * request for getStatistics (analyse/getStatistics) route (string id)
    * 
    * this function receives an id for a project and returns its statistics
    * the data is read from the Database inside the Statistic model
*/

router.post('/getStatistics', (req, res, next) => {
    let id = req.body.id;

    Statistic.aggregate([{$match : {"project" : ObjectId(req.body.id)}}, {$sort : { timestamp : -1}}, {$limit : 1}])
    .exec()
    .then(res1 => {
        res.status(200).json({
            success: true,
            message: "Successfully retrieved statistics",
            result: res1
        });
    })
    .catch(err1 => {
        res.status(200).json({
            success: false,
            result : "Error finding first project"
        });
    });
});


/***
    * request for getUserStatistics (analyse/getUserStatistics) route ()
    * 
    * this function aggregates the data on all users in the DB and returns a json object with the results
    * the data is read from the Database inside the User model
*/
router.post('/getUserStatistics', (req, res, next) => {
    
    User.find()
    .exec()
    .then(res1 => {
        console.log(res1.length);
        let userNum = res1.length;
        let numToday = 0;
        for (let i = 0; i < userNum; i++)
        {
            if (res1[i].created === undefined) continue;
            if (isCurrentDate(res1[i].created))
                numToday++;
        }

        //let total = 0;

        //for (let i = 0; i < userNum; i++)
        //{
        //    if (res1[i].projects === null)
        //        continue;

        //    total += res1[i].projects.length;
        //}

        Project.count({})
        .exec()
        .then(res2 => {
            console.log(res2);
            let total = res2;
            let avgProjPerUser = total / userNum;

            const obj = {
                totalUsers : userNum,
                todayUsers : numToday,
                averageProjectsPerUser : avgProjPerUser
            }
            res.status(200).json({
                success: true,
                message: "Successfully retrieved User Statistics",
                result: obj
            });
        })
        .catch(err => {
            console.log(err);
            res.status(200).json({
                success: false,
                result : "Failed to count projects"
            });
        });

    })
    .catch(err => {
        console.log(err);
        res.status(200).json({
            success: false,
            result : "Error finding users"
        });
    });
});

/***
    * request for getProjectStatistics (analyse/getProjectStatistics) route ()
    * 
    * this function aggregates the data on all projects in the DB and returns a json object with the results
    * the data is read from the Database inside the Project and Statistics model
*/

router.post('/getProjectStatistics', (req, res, next) => {
    Project.count({})
    .exec()
    .then(res1 => {
        let projNum = res1;
        console.log(res1);
        Statistic.count({})
        .exec()
        .then(res2 => {
            console.log(res2);
            let projAnalysedTotal = res2;
            Statistic.aggregate([{$group: {_id: null, total : {$sum: '$mean'}}}])
            .exec()
            .then((result)=>{
                const returnObject = {
                    totalProjects : projNum,
                    totalTimesAnalysed : projAnalysedTotal,
                    totalAverageSentiment : result[0]["total"]
                }
                console.log(returnObject);
                res.status(200).json({
                    success: true,
                    message: "Successfully retrieved Project Statistics",
                    result: returnObject
                });
            }).catch((err)=>{
                console.log(err);
                res.status(500).json({
                    success: false,
                    message: "Error occurred finding statistics",
                    result: null
                });
            })
        })
        .catch(err2 => {
            console.log(err2);
            res.status(500).json({
                success: false,
                message: "Error occurred finding statistics",
                result: null
            });
        });
    })
    .catch(err => {
        res.status(200).json({
            success: false,
            message: "Error finding projects",
            result: null
        });
    });
});


function isCurrentDate(d)
{
    const today = new Date();
    return today.getDate() == d.getDate() && today.getMonth() == d.getMonth() && today.getFullYear() == d.getFullYear();
}

module.exports = router;
