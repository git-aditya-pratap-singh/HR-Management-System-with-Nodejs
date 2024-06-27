interface PunchD {
    time: string; 
}

interface Punch {
    index: number;
    value: string;
}

interface LastPunches {
    IN?: string;
    OUT?: string;
}

class PunchService {

    sortPunches = (punches: PunchD[]) => {
        punches.sort((a: PunchD, b: PunchD) => {
            const numA = parseInt(a.time.replace(/\D/g, ''), 10); // Extract numbers from time string
            const numB = parseInt(b.time.replace(/\D/g, ''), 10); // Extract numbers from time string
            const suffixA = a.time.slice(-1); // Get last character of time string
            const suffixB = b.time.slice(-1); // Get last character of time string
    
            if (numA === numB) {
                // If numbers are equal, sort by suffix ('O' before other characters)
                return (suffixA === 'O' ? -1 : 1) - (suffixB === 'O' ? -1 : 1);
            } else {
                // Sort by numerical value
                return numA - numB;
            }
        });
    }

    uniqueValues = (punches: string[]): string[] => {
        return Array.from(new Set(punches));
    }

    getLastInfo = (sortedPunches: string[]): { lastTypeRecords: LastPunches } => {
        let lastin: Punch | null = null;
        let lastout: Punch | null = null;
    
        sortedPunches.forEach((value: string, index: number) => {
            if (value.slice(-1) === "I") {
                lastin = { index, value };
            } else if (value.slice(-1) === "O") {
                lastout = { index, value };
            }
        });
    
        let records: Punch[] = [];
        if (lastin !== null) {
            records.push(lastin);
        }
        if (lastout !== null) {
            records.push(lastout);
        }
    
        let lastPunches: LastPunches = {};
        records.forEach((record: Punch) => {
            let punchInfo = record.value.split(record.value.slice(-1));
            let punchDateTime = punchInfo[0];
            let punchType = (record.value.slice(-1) === 'I') ? 'IN' : 'OUT';
            //lastPunches[punchType] = punchDateTime;
        });
        return { lastTypeRecords: lastPunches };
    }


}

export default PunchService;