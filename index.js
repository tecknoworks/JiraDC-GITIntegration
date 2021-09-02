const express = require('express')
const bodyParser = require('body-parser');
var mongoose = require('mongoose');
const fetch = require("node-fetch");
var cors = require('cors')
const app = express()
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

const GitProject = require('./models/project')
const Commit = require('./models/commit');
const e = require('express');
const { url } = require('inspector');

const port = 8092

var mongoDB = 'mongodb+srv://cata:cata@cluster0.wcbqw.mongodb.net/first?retryWrites=true&w=majority';
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.post('/addworkitem', async (req, res) => {
    let newWorkItem = req.body
    let record= await GitProject.find({project_id:newWorkItem.project_id})
    console.log(newWorkItem)
    if(record.length!==0){
        let workItemList=record.workitem_id
        workItemList.push(newWorkItem.workitem_id)
        const editedObject = { project_id:newWorkItem.project_id,git_url:newWorkItem.git_url,workitem_id:workItemList, owner:newWorkItem.owner, repository:newWorkItem.repository}
        const filter={project_id:newWorkItem.project_id}
        let update_= await GitProject.findOneAndUpdate(filter, editedObject, {
            new: true,
            upsert: true 
        });
        res.send(update_)
    }else{
        var addWorkItem=new GitProject({project_id:newWorkItem.project_id, git_url:newWorkItem.git_url, workitem_id:newWorkItem.workitem_id})
        await GitProject.create(addWorkItem)
    }
    //console.log(addWorkItem)
    res.send(addWorkItem)
})
app.post('/allworkitems', async (req, res) => {
    let result = [];
    if (req.body.length) {
        for (let index = 0; index < req.body.length; index++) {
            if(req.body[index]!==''){
                const details = await Commit.find({ 'workitem_id': req.body[index] })
                if(details.length!==0){
                    let commits=[]
                    details.map(d=>{
                        var dateTime={
                            year:d.date_commited.getFullYear(),
                            month:d.date_commited.getMonth(),
                            day:d.date_commited.getDate(),
                            hour:d.date_commited.getHours(),
                            minute:d.date_commited.getMinutes()
                        }
                        var url="https://github.com/"+d.owner+"/"+d.repository+"/commit/"+d.sha
                        const commitElement={
                            message:d.message,
                            dateTime:dateTime,
                            author_name:d.author_name,
                            url:url,
                        }
                        commits.push(commitElement);
                        console.log(commits)
                    })
                    result.push(commits)
                }
                else
                    result.push([]);
            }else{
                result.push([]);
            }
        }
    }
    console.log(result)
    res.json(result)
})
app.get('/all', async (req, res) => {
    let record= await GitProject.find({})
    res.send(record)
})
async function pollingFunction(){
    let commits=[]
    let record= await GitProject.find({})
   for(let index=0; index < record.length; index++){

        await fetch(record[index].git_url, 
            { 
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then(res => res.json())
            .then(data => commits = data);

        for(let i=0;i<commits.length;i++){
            let allmessage=commits[i].commit.message
            let project=""
            let wiId=""
            let messageIndex=0
            let finalMessage=""
            for(let index=0; index<3;index++){
                project+=allmessage[index]
            }
            for(let index=3; index<allmessage.length;index++){
                if(allmessage[index] >='0' && allmessage[index]<='9')
                    wiId+=allmessage[index]
                else{
                    messageIndex=index
                    break
                }
            } 
            for(let index=messageIndex+1;index<allmessage.length;index++)
                finalMessage+=allmessage[index]
           let addCommit=new Commit({sha:commits[i].sha , 
                                         workitem_id:project+wiId ,
                                         project_id: project,
                                         message:finalMessage,
                                         author_name: commits[i].commit.author.name ,
                                         date_commited:new Date(commits[i].commit.author.date),
                                         url:commits[i].url,
                                         owner:record[index].owner,
                                        repository:record[index].repository}
                                         )
            let search= await Commit.find({sha:addCommit.sha }) 
            console.log(addCommit)
            if(search.length===0 && commits[i].commit.message!=="first commit"){
                console.log("hey")
                await Commit.create(addCommit)
            }                           
        }
    }
    setTimeout(pollingFunction, 50000);
}
//pollingFunction();


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })