import MongoClient from './client.js';

export const insertOne = async (db, coll, dataToInsert) => {
    let response = undefined;

    try {
        await MongoClient.connect();
        const collection = MongoClient.db(db).collection(coll);
        response = await collection.insertOne(dataToInsert);
    } catch (error) {
        console.error(error);
    } finally {
        MongoClient.close();
    }
    return response;
};