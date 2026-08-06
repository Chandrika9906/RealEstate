import mongoose  from "mongoose";
export const connectDB = async () => {
    await mongoose.connect("mongodb+srv://<db_username>:I3rBqHlE5AsYFXBQ@cluster0.sbvep9i.mongodb.net/RealEstate").then(()=>{
        console.log("MongoDB Connected");
    })
}