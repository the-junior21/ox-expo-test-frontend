import mongoose from "mongoose"
let isConnected = false
export async function connectToMongo(){
    if(isConnected) return;
    try{
        await mongoose.connect(process.env.MONGO_URI,{
            useNewUrlParser:true,
            useUnifiedTopology:true,
        })
        isConnected = true;
        console.log("mongodb connected")
    }catch(err){
        console.log("mongodb connection error ",err)
    }
}  