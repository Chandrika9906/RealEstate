import mongoose  from "mongoose";
export const connectDB = async () => {
    await mongoose.connect(
            "mongodb+srv://chandrika992006_db_user:Chandusree@cluster0.sbvep9i.mongodb.net/RealEstate"
        ).then(()=>{
            console.log("DB CONNECTED");
        })
}
 