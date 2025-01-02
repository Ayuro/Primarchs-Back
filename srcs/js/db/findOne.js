import MongoClient from './client.js';

export const findOne = async (db, coll, query, projection = '') => {
    let data = undefined;

    try {
        await MongoClient.connect();
        const collection = MongoClient.db(db).collection(coll);
        const response = await collection.findOne(query, { projection });
        data = response;
    } catch (error) {
        console.error(error);
    } finally {
        MongoClient.close();
    }

    return data;
};