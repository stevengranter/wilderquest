import "dotenv/config"
import mysql from "mysql2/promise";
import dbConfig from "./config/dbConfig.js";
import {faker} from "@faker-js/faker"
import * as emoji from "node-emoji"
import pluralize from "pluralize"
import {createId} from "@paralleldrive/cuid2"
import axios from "axios";

const db = await mysql.createConnection(dbConfig)

const API_URL = "https://api.inaturalist.org/v1/taxa/"

type inatApiParams = {
    q:string,
    rank?:string,
    order?: "desc" | "asc",
    order_by?:string
}

const fetchInatTaxa = async (query: inatApiParams) => { //default to empty object if nothing is passed
    const {
        q = '',
        rank = 'species', // Default to 'species'
        order = 'asc', // Default to 'asc'
        order_by = 'name', // Default to 'name'
        ...rest // Capture any other properties passed in query
    } = query;

    const params = { q, rank, order, order_by, ...rest}; //recreate the params object.

    const result = await axios.get(API_URL, {params: params});

    const taxonArray = result.data.results.map(record => {
        return record.id
    })

    return taxonArray
};

function getRandomItem<T>(arr: T[]): T | undefined {
    if (arr.length === 0) {
        return undefined; // Return undefined for an empty array
    }

    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
}

function getRandomInt(min: number, max: number): number {
    if (min > max) {
        throw new Error("Min value must be less than or equal to max value.");
    }

    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function capitalizeString(str: string): string {
    if (!str) {
        return str; // Return the original string if it's empty or nullish
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}


const adminUser = {
    username: "admin",
    password: "admin",
    email: "adminUser555@example.com",
    user_cuid: createId(),
    created_at: new Date(),
    updated_at: new Date(),
    role_id: 2,
}

const createFakeUser = () => {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const username = faker.internet.username({firstName, lastName})
    const user_cuid = createId()
    const email = faker.internet.email({firstName, lastName})
    const password = faker.internet.password({memorable:true})
    const role_id = 1
    const created_at = faker.date.between({ from: '2020-01-01', to: Date.now() })
    const updated_at = faker.date.between({ from: '2020-01-01', to: Date.now() })
    return {username,user_cuid,email,password,role_id,created_at,updated_at}
}

const createFakeCollection = (animal = faker.animal.type()) => {
    const user_id = getRandomInt(1,12)
    // const animal = animal || faker.animal.type()
    const animalEmoji= emoji.find(animal)
    const prefixes = ["My fave ", "","","","","","Awesome ", "My favourite ", "", "I love "]
    const suffixes = ["!",""," ❤️"," ⭐️","","","","",""]
    const nameStr = getRandomItem(prefixes) + pluralize(animal) + getRandomItem(suffixes)
    const name= capitalizeString(nameStr)
    const created_at = faker.date.between({ from: '2020-01-01', to: Date.now() })
    const updated_at = faker.date.between({ from: '2020-01-01', to: Date.now() })
    return {name,user_id,emoji:animalEmoji?.emoji || "🐾", created_at,updated_at}
}




const createUsers = async (quantity: number) => {
    const userIds = []
    for (let i = 0; i < quantity; i++) {
        const user = createFakeUser()
        const user_id = await addRowToTable("user_data", user)
        const animal = faker.animal.type()
        const collection = createFakeCollection(animal)
        collection.user_id = user_id
        const collection_id = await addRowToTable("collections", collection)
        const taxaArray = await fetchInatTaxa({q: animal})
        for (const taxon_id of taxaArray) {
            await addRowToTable("collections_to_taxa",{collection_id, taxon_id})
        }
        userIds.push(user_id)
    }
    return userIds;
}



const dropTable = async (tableName:string) => {
    await db.execute(`DROP TABLE ${tableName}`);
}

async function addRowToTable<T extends object>(tableName:string, data:T) {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map(() => '?').join(', ');
    try {
        const [result] = await db.execute<any>(
            `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
            values
        );
        return result.insertId; // Return the ID of the newly inserted record
    } catch (error) {
        console.error(`Error creating record in ${tableName}:`, error);
        throw error;
    }
}




// console.log(users)
// console.log(collections)
console.log(await createUsers(1))
// console.log(await addRowsToTable("collections",collections))
// console.log(await(fetchInatTaxa({q:"squirrel",})));


