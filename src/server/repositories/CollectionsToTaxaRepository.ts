import BaseRepository from './BaseRepository.js';
import {Collection} from "../../types/types.js";

class CollectionsRepository extends BaseRepository<Collection> {
    constructor() {
        super('collections_to_taxa');
    }

}

export default new CollectionsRepository(); // Export a single instance
