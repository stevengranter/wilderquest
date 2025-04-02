import BaseRepository from './BaseRepository.js';
import {Collection} from "../../types.js";

class CollectionsRepository extends BaseRepository<Collection> {
    constructor() {
        super('collections');
    }

}

export default new CollectionsRepository(); // Export a single instance
