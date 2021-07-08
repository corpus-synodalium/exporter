export const getSortedIds = results => {
    const uniqueIDs = new Set();
    results.forEach(result => {
        const { record_id } = result.metadata_fields;
        uniqueIDs.add(record_id);
    });
    const ids = Array.from(uniqueIDs);
    ids.sort();
    return ids;
};

export const getCitation = results => {
    const uniqueCitations = new Map();
    results.forEach(result => {
        const {
            record_id,
            origPlace,
            year,
            edition,
            source,
        } = result.metadata_fields;

        if (!uniqueCitations.has(record_id)) {
            /**
             * Format: Place (Year), in [Edition; if Edition field is empty, then instead display Source]
             */
            const citationString = `${origPlace} (${year}), in ${
                edition ? edition : source
            }`;
            uniqueCitations.set(record_id, citationString);
        }
    });

    return [...uniqueCitations.values()];
};

export const getShortRecords = (results, url) => {
    const baseURL = url.substring(0, url.indexOf('/query?'));

    const getLinkToFullText = citationLinks => {
        const basePath = citationLinks.doc.substring(
            0,
            citationLinks.doc.indexOf('/table-of-contents')
        );
        return `${baseURL}/${basePath}/2`;
    };

    const getLinkToMetadata = citationLinks => {
        const basePath = citationLinks.doc.substring(
            0,
            citationLinks.doc.indexOf('/table-of-contents')
        );
        return `${baseURL}/${basePath}/1`;
    };

    const getNumberOfHitsForRecord = recordID => {
        let count = 0;
        results.forEach(result => {
            if (result.metadata_fields.record_id === recordID) {
                count++;
            }
        });
        return count;
    };

    const uniqueCitations = new Map();
    results.forEach(result => {
        const {
            // allPlace,
            classification,
            country,
            // create_date,
            diocese,
            // diocese_id,
            edition,
            // filename,
            // head,
            issuing_authority,
            language,
            // origDate,
            origPlace,
            province,
            record_id,
            source,
            // title,
            year,
        } = result.metadata_fields;

        if (!uniqueCitations.has(record_id)) {
            /**
             * Format: Place (Year), in [Edition; if Edition field is empty, then instead display Source]
             */
            const lines = [];
            if (record_id) {
                lines.push(`Record ID: ${record_id}`);
                const numHits = getNumberOfHitsForRecord(record_id);
                lines.push(`Number of hits: ${numHits}`);
            }
            if (year) {
                lines.push(`Year: ${year}`);
            }
            if (origPlace) {
                lines.push(`Place: ${origPlace}`);
            }
            if (province) {
                lines.push(`Province: ${province}`);
            }
            if (diocese) {
                lines.push(`Diocese: ${diocese}`);
            }
            if (country) {
                lines.push(`Modern country: ${country}`);
            }
            if (classification) {
                lines.push(`Classification: ${classification}`);
            }
            if (issuing_authority) {
                lines.push(`Issuing authority: ${issuing_authority}`);
            }
            if (language) {
                lines.push(`Language: ${language}`);
            }
            if (edition) {
                lines.push(`Edition: ${edition}`);
            }
            if (source) {
                lines.push(`Source: ${source}`);
            }
            if (result.citation_links) {
                const fullTextLink = getLinkToFullText(result.citation_links);
                lines.push(`CoSyn URL (full text): ${fullTextLink}`);
            }
            if (result.citation_links) {
                const metadataLink = getLinkToMetadata(result.citation_links);
                lines.push(`CoSyn URL (all metadata): ${metadataLink}`);
            }
            lines.push('\r\n---------------------------\r\n');

            const citationString = lines.join('\r\n');
            uniqueCitations.set(record_id, citationString);
        }
    });

    return [...uniqueCitations.values()];
};
