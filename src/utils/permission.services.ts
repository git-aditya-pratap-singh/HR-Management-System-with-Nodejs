interface IPermissions {
    [key: string]: {
        [model: string]: string[];
    } | string[];
}

const Isnotpermissions: IPermissions = {
    admin: ['*'], 
    Manager: {
        department: ['getDepartmentList', 'addDepartment'],
        seats: ['getSublocationList'],
        location: ['getLocationList', 'addLocation', 'editLocation'],
        subLocation: ['getSubLocationList', 'addSubLocation', 'editSubLocation'],
        shift: ['getShiftList', 'addShift', 'editShift'],
        employee: ['*'],
        viewprofile: ['*']
    },
    itsupport: {
        department: ['getDepartmentList', 'addDepartment'],
        seats: ['*'],
        location: ['getLocationList', 'addLocation', 'editLocation'],
        subLocation: ['getSubLocationList', 'addSubLocation', 'editSubLocation'],
        shift: ['getShiftList', 'addShift', 'editShift'],
        employee: ['*'],
        viewprofile: ['*']
    },
    employee: {
        department: ['getDepartmentList', 'addDepartment'],
        seats: ['getSublocationList'],
        location: ['getLocationList', 'addLocation', 'editLocation'],
        subLocation: ['getSubLocationList', 'addSubLocation', 'editSubLocation'],
        shift: ['getShiftList', 'addShift', 'editShift'],
        employee: ['*'],
        viewprofile: ['profileinfo', 'addusers', 'editpassword']
    }
};

export default Isnotpermissions;
