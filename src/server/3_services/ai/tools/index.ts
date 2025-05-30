import { getCurrentDateTool, getDateInfoTool } from './date-tools.js'
import { getINatTaxonData } from './taxonomic-data-tools.js'

// Export individual tools
export { getCurrentDateTool, getDateInfoTool, getINatTaxonData }

// Export tool collections
export const dateTools = {
    getCurrentDate: getCurrentDateTool,
    getDateInfo: getDateInfoTool,
}

export const taxonomicDataTools = {
    getINatTaxonData: getINatTaxonData,
}

export const allTools = {
    ...dateTools,
    ...taxonomicDataTools,
}
