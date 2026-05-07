import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { useDispatch, useSelector } from 'react-redux';
import { Badge } from 'primereact/badge';
import { Dialog } from 'primereact/dialog';
import { ColorMappingService } from '../../../../service/ColorMappingService';
import { Dropdown } from 'primereact/dropdown';
import { UserSettingService } from '../../../../service/settings/UserSettingService';
import { addData, removeData } from '../../../../store/formMessage.slice';
import '../../../../assets/styles.css';
import { useAuth } from '../../../../store/useAuth';

export default function UserLanesSetup() {
    const [loading, setLoading] = useState(false);
    const [btnName, setBtnName] = useState('Add Color');
    const [totalRecords, setTotalRecords] = useState(0);
    const [mappedColor, setMappedColor] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [users, setUsers] = useState(null);
    const [removeDataRow, setRemoveDataRow] = useState(null); //  renamed to avoid name conflict
    const [isEditMode, setIsEditMode] = useState(false);
    const [dataToUpdate, setDataToUpdate] = useState([]);

    const toast = useRef();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const {hasActionAccess} = useAuth();
    const PAGE_KEY = "color_mapping";
    const canEdit = hasActionAccess(PAGE_KEY, "edit_user_color_mapping");
    const canDelete = hasActionAccess(PAGE_KEY, "delete_user_color_mapping");
    

// For column visibility
const showActionColumn = canEdit || canDelete;
    const formMessageDetail = useSelector((state) => state.formMessage.detail);
    const formMessageSeverity = useSelector((state) => state.formMessage.severity);
    const formMessageSummary = useSelector((state) => state.formMessage.summary);

    const items = [{ label: 'Lane Users' }, { label: 'List' }];
    const home = { icon: 'pi pi-home', url: '/' };

    let networkTimeout = null;
    const colors = [
        { name: 'Black', code: '#000000' },
        { name: 'Red', code: '#ff0000' },
        { name: 'Green', code: '#00ff00' },
        { name: 'Orange', code: '#ffa500' },
        { name: 'Blue', code: '#2f00ffff' },
        { name: 'Purple', code: '#800080' },
        { name: 'Cyan', code: '#00ffff' },
    ];

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            usr_Login: { value: null, matchMode: 'contains' },
        }
    });

    useEffect(() => {
        UserSettingService.getAllUsers().then((data) => {
            setUsers(data.data);
        });
    }, []);

    useEffect(() => {
        if (formMessageDetail !== '') {
            toast.current.show({
                severity: formMessageSeverity,
                summary: formMessageSummary,
                detail: formMessageDetail
            });
            dispatch(removeData()); //  Works fine now — no conflict
        }
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        networkTimeout = setTimeout(() => {
            ColorMappingService.getMappedUSers(lazyState).then((data) => {
                setTotalRecords(data.totalRecords);
                setMappedColor(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
    };

    const onPage = (event) => setlazyState(event);
    const onSort = (event) => setlazyState(event);
    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };

    const userBodyTemplate = (rowData) => <div className='pl-4'>{rowData.usr_Login}</div>;
    const colorBodyTemplate = (rowData) => <div>{rowData.color}</div>;

    const handleChange = (event) => {
        const data = {
            id: dataToUpdate.id,
            color_name: event.target.value,
        };

        setLoading(true);
        ColorMappingService.updateColorUsers(data).then((data) => {
            if (data.error === 0) {
                setIsEditMode(false);
                setDataToUpdate([]);
                // toast.current.show({ severity: 'success', summary: 'Color Updated Successfully', detail: data.message });
                dispatch(addData({ severity: 'success', detail: data.message, summary: 'Color Updated Successfully' }));
                loadLazyData();
            } else {
                toast.current.show({ severity: 'error', summary: 'Error while updating color', detail: data.message });
            }
        });
    };

    const editColorBodyTemplate = (rowData) => {
        if (rowData.id === dataToUpdate.id) {
            return (
                <select className="select-box" onChange={handleChange}>
                    {colors.map(option => (
                        <option key={option.name} value={option.name} selected={option.name === dataToUpdate.color}>
                            {option.name}
                        </option>
                    ))}
                </select>
            );
        } else {
            return <div>{rowData.color}</div>;
        }
    };

    // const is_activeBodyTemplate = (rowData) => (
    //     <div className='flex gap-2 justify-content-center'>
    //         <Button icon="pi pi-pencil" rounded severity="success" aria-label="Edit" onClick={() => editUserColor(rowData)} />
    //         <Button icon="pi pi-times" rounded severity="danger" aria-label="Remove" onClick={() => confirmationBox(rowData)} />
    //     </div>
    // );
    const is_activeBodyTemplate = (rowData) => {
    return (
        <div className='flex gap-2 justify-content-center'>
            {canEdit && (
                <Button 
                    icon="pi pi-pencil" 
                    rounded 
                    severity="success" 
                    aria-label="Edit" 
                    onClick={() => editUserColor(rowData)} 
                />
            )}

            {canDelete && (
                <Button 
                    icon="pi pi-times" 
                    rounded 
                    severity="danger" 
                    aria-label="Remove" 
                    onClick={() => confirmationBox(rowData)} 
                />
            )}
        </div>
    );
};

    const addUserColor = () => {
        const data = {
            user_id: selectedUser?.usr_ID,
            color_name: selectedColor?.name,
        };

        if (!data.user_id || !data.color_name) {
            toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'Please select both user and color.' });
            return;
        }

        setLoading(true);
        ColorMappingService.addColorUsers(data).then((data) => {
            setLoading(false);
            if (data.error === 0) {
                setSelectedUser('');
                setSelectedColor('');
                // toast.current.show({ severity: 'success', summary: 'Color Mapped to User', detail: data.message });
                 dispatch(addData({ severity: 'success', detail: data.message, summary: 'Color Mapped to User' }));
                // FIX: Reset pagination to first page after adding
                setlazyState(prev => ({ ...prev, first: 0, page: 1 }));
                loadLazyData();
            } else {
                toast.current.show({ severity: 'error', summary: 'Error while mapping user to color', detail: data.message });
            }
        });
    };

    const confirmationBox = (rowData) => {
        setRemoveDataRow(rowData);
        setDisplayConfirmation(true);
    };

    const removeUserColor = () => {
        setDisplayConfirmation(false);
        const data = { id: removeDataRow.id };

        setLoading(true);
        ColorMappingService.removeColorUsers(data).then((data) => {
            setLoading(false);
            if (data.error === 0) {
                setRemoveDataRow(null);
                // toast.current.show({ severity: 'success', summary: 'Color removed from user', detail: data.message });
                dispatch(addData({ severity: 'success', detail: data.message, summary: 'Color removed from user' }));
                //  FIX: Reset pagination to first page after removing
                setlazyState(prev => ({ ...prev, first: 0, page: 1 }));
                loadLazyData();
            } else {
                toast.current.show({ severity: 'error', summary: 'Error while removing color from user', detail: data.message });
            }
        });
    };

    const editUserColor = (data) => {
        setIsEditMode(true);
        setDataToUpdate(data);
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center" style={{ paddingBottom: '35px', paddingTop: '35px' }}>
            <span className="block mt-4 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <div className="p-inputgroup flex gap-4">
                    <Dropdown value={selectedUser} onChange={(e) => setSelectedUser(e.value)} options={users} optionLabel="usr_Login" placeholder="Select User"
                        filter className="w-full md:w-24rem" />
                    <Dropdown value={selectedColor} onChange={(e) => setSelectedColor(e.value)} options={colors} optionLabel="name" placeholder="Select Color"
                        filter className="w-full md:w-24rem" />
                    {hasActionAccess(PAGE_KEY, "add_user_color_mapping") &&(<Button label={btnName} icon="pi pi-plus" severity="sucess" onClick={() => addUserColor()} />)}
                </div>
            </span>
        </div>
    );

    const confirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => removeUserColor()} className="p-button-text" autoFocus />
        </>
    );

    return (
        <>
            <Helmet>
                <title>Color Mapping | Sagis</title>
            </Helmet>
            <Toast ref={toast} />
            <BreadCrumb model={items} home={home} />
            <Dialog header="Confirmation" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>

            <div className="card">
                <h3>User Color Mapping</h3>
                <DataTable
                    value={mappedColor}
                    lazy
                    filterDisplay="row"
                    dataKey="sku_mantis"
                    paginator
                    showGridlines
                    first={lazyState.first}
                    rows={lazyState.rows}
                    totalRecords={totalRecords}
                    onPage={onPage}
                    onSort={onSort}
                    size="small"
                    sortField={lazyState.sortField}
                    sortOrder={lazyState.sortOrder}
                    onFilter={onFilter}
                    filters={lazyState.filters}
                    rowsPerPageOptions={[25, 50, 100, 500, 1000]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    loading={loading}
                    tableStyle={{ minWidth: '75rem' }}
                    emptyMessage="No records found."
                    header={header}
                    scrollable
                    scrollHeight="600px"
                    removableSort
                >
                    <Column style={{ width: '80%' }} field="lane" header="User Name" body={userBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column style={{ width: '10%' }} field="lane" header="Color" body={(isEditMode === true) ? editColorBodyTemplate : colorBodyTemplate} />
                    {showActionColumn && ( <Column style={{ width: '10%' }} header="Action"  body={is_activeBodyTemplate}  />)}               
                     </DataTable>
            </div>
        </>
    );
}
