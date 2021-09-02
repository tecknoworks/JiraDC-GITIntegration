const mongoose = require('mongoose')

const model = mongoose.Schema({
    sha: {
        type: String,
        required: true
    },
    workitem_id: {
        type: String,
        required: true
    },
    project_id:{
        type: String,
        required: false
    },
    message: {
        type: String,
        required: true
    },
    author_name: {
        type: String,
        required: true
    },
    date_commited:{
        type: Date,
        required: false
    },
    url:{
        type: String,
        required: false
    },
});

module.exports = new mongoose.model("Commit", model)