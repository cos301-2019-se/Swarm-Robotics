const mongoose = require('mongoose');

const statisticSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    min : Number,
    max : Number,
    std_dev : Number,
    variance : Number,
    mean : Number,
    mode : [ {type : Number } ],
    median : Number,
    timestamp : 
    {
        type : Date,
        default : Date.now
    },
    graphs : {
        histogram : [
            {type : Number}
        ],
        averageOverTime : [
            {
                averageSentiment : Number,
                tweets : [
                    {
                        type : Object
                    }
                ]
            }
        ],
        changeOverTime : [
            {
                type : Number
            }
        ]
    },
    project : {type : mongoose.Schema.Types.ObjectId, ref : 'Project'}
    
});

module.exports = mongoose.model('Statistic', statisticSchema);