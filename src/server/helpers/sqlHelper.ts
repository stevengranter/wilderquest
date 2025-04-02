const selectQuery = (
    tableName: string,
    selectColumns: Array<string>,
    whereClause: string) => {
    const selectColumnString = selectColumns.toString()
    return `SELECT ${selectColumnString} FROM ${tableName} WHERE ${whereClause}`
}


const selectAllQuery = (
    tableName: string,
    whereClause: string) => {
    return `SELECT * FROM ${tableName} WHERE ${whereClause}`
}


// const updateQuery = (
//     tableName: string,
//     updateColumns: Array<string>,
//     whereClause: string) => {
//     const updateColumnString = updateColumns.toString()
//     return `UPDATE ${tableName} SET ${updateColumnString} WHERE ${whereClause}`
// }

const insertQuery = (
    tableName: string,
    insertColumns: Array<string>) => {

    const insertColumnString = insertColumns.toString()

    const numColumns = insertColumns.length
    let insertValueString = ""
    for (let i = 0; i < numColumns; i++) {
        insertValueString += "?"
        if (i < numColumns - 1) {
            insertValueString += ","
        }
    }

    return `INSERT INTO ${tableName} (${insertColumnString}) VALUES (${insertValueString})`
}

export const sqlHelper = {
    select: selectQuery,
    selectAll: selectAllQuery,
    // update: updateQuery,
    insert: insertQuery
}

interface SelectQueryObject {
    table: string;
    columns: string;
    where: string;
}




