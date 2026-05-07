import { Menu } from 'primereact/menu';
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { useDispatch, useSelector } from 'react-redux';
import { removeData } from "../../../../store/formMessage.slice"
import { UserSettingService } from '../../../../service/settings/UserSettingService';
import { CountService } from '../../../../service/Count/CountService';
import { CountDetails } from '../../../../service/operations/count-details';
import { Badge } from 'primereact/badge';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Dropdown } from 'primereact/dropdown';
import { Controller, useForm } from 'react-hook-form';
import { Dialog } from 'primereact/dialog';
import { Tooltip } from 'primereact/tooltip';
import '../../../../assets/styles.css';
import { ProgressSpinner } from 'primereact/progressspinner';

export default function Users() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [users, setUsers] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState(null);
    const [id, setid] = useState(null);
    const [countDetailModel, setcountDetailModel] = useState(false);
    const [CountDetail, setCountDetail] = useState([]);   
    const [totalRecords1, setTotalRecords1] = useState(0);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [modelMsg, setModelMsg] = useState(null);    
    const toast = useRef();
    const navigate = useNavigate();
    const [UserDropDown, setUserDropDown] = useState(null);
    const [countlabel, setcountlabel] = useState(null);
    const [SecondUserDropDown, setSecondUserDropDown] = useState(null);
    const [countDropDown, setcountDropDown] = useState(null);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            Aisle: { value: null, matchMode: 'contains' },
            Level: { value: null, matchMode: 'contains' },
            UPC: { value: null, matchMode: 'contains' },
            Exp: { value: null, matchMode: 'contains' },
            created_at: { value: null, matchMode: 'contains' },
            updated_at: { value: null, matchMode: 'contains' },
            AssignedToUser: { value: null, matchMode: 'contains' },
            CreatedByUser: { value: null, matchMode: 'contains' },
            count_name: { value: null, matchMode: 'contains' },
            Parent_CountId: { value: null, matchMode: 'contains' },
            quantity: { value: null, matchMode: 'contains' },
            LocationPerformed: { value: null, matchMode: 'contains' },
            TotalLocation: { value: null, matchMode: 'contains' },
            close_count: { value: null, matchMode: 'contains' },
            Rerun_count: { value: null, matchMode: 'contains' },
            count_Id: { value: null, matchMode: 'contains' },
            adjustment_type: { value: null, matchMode: 'contains' },
        }
    });
    const [lazyStatedetail, setlazyStateDetail] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            location_Code: { value: null, matchMode: 'contains' },
            not_match: { value: null, matchMode: 'contains' },
            adjustment_type: { value: null, matchMode: 'contains' },
            Item_Code: { value: null, matchMode: 'contains' },
        }
    });
  
    const getFormErrorMessage = (name) => {
        return errors[name] ? <small className="p-error">{errors[name].message}</small> : null;
    };


    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)
    const menuLeft = useRef(null);
    const dispatch = useDispatch()
    const [btnDisabled, setbtnDisabled] = useState(true);

    const items = [{ label: 'Count' }, { label: 'Cycle Count'}];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;
    const defaultValues = {
        User: null,
        defaultCountName: '',
        CountName: null
    }
    const form = useForm({ defaultValues });
    const errors = form.formState.errors;
    useEffect(() => {
        getUser();
        if(formMessageDetail != ''){
            toast.current.show({ severity: formMessageSeverity, summary: formMessageSummary, detail: formMessageDetail});
            dispatch(removeData());
        }
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = () => {
        setLoading(true);
        setSelectedUsers(null);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            CountService.getAllCount( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setUsers(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
    };
    const getUser = () => {
     
        CountService.getUser().then((data) => {
            setcountDropDown(data.count);
            setUserDropDown(data.data); 
        }).catch((error) => {
            console.error('Error fetching users:', error);
        });

    };

    const onPage = (event) => {
        setlazyState(event);
    };

    const onSort = (event) => {
        setlazyState(event);
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };
    const onPage1 = (event) => {
        setlazyStateDetail(event);
    };

    const onSort1 = (event) => {
        setlazyStateDetail(event);
    };

    const onFilter1 = (event) => {
        event['first'] = 0;
        setlazyStateDetail(event);
    };

    const onSelectionChange = (event) => {
        const value = event.value;
        setSelectedUsers(value);
        setSelectAll(value.length === totalRecords);
        // console.log("Selected users:", value);
      
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {

                setSelectAll(true);
    

        } else {
            setSelectAll(false);
            setSelectedUsers([]);
        }
    };

   
    const UPCBodyTemplate = (rowData) => {
        
        return (
            <>
            {(rowData.UPC == 'Y')?<Badge value="Yes" severity="success"></Badge> : <Badge value="No" severity="danger"></Badge> }
        </>
        );
    };
    const ExpBodyTemplate = (rowData) => {
        
        return (
            <>
            {(rowData.Exp == 'Y')?<Badge value="Yes" severity="success"></Badge> : <Badge value="No" severity="danger"></Badge> }
        </>
        );
    };
    const quantityBodyTemplate = (rowData) => {
        
        return (
            <>
            {(rowData.quantity == 'Y')?<Badge value="Yes" severity="success"></Badge> : <Badge value="No" severity="danger"></Badge> }
        </>
        );
    };
    const close_countBodyTemplate = (rowData) => {
        
        return (
            <>
            {(rowData.close_count == '1')?<Badge value="Yes" severity="success"></Badge> : <Badge value="No" severity="danger"></Badge> }
        </>
        );
    };
    const Rerun_countBodyTemplate = (rowData) => {
        
        return (
            <>
            {(rowData.Rerun_count == '1')?<Badge value="Yes" severity="success"></Badge> : <Badge value="No" severity="danger"></Badge> }
        </>
        );
    };

    const adjustmentBodyTemplate = (data) => {
        if (data.adjustment_type == 0) {
            return '';
        }
        return data.adjustment_type == 2 ? 'Manual' : 'System';
    };
    const IssueFlags = [
        { code: '0', name: 'Count with Issue' },
        { code: '1', name: 'System Adj.' },
        { code: '2', name: 'Manual Adj.' },
    ];

    const issueRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '3em' }} value={options.name} 
            optionValue="code" optionLabel="name"  options={IssueFlags} 
            onChange={(e) => options.filterApplyCallback(e.value)} 
            itemTemplate={flagTemplate} placeholder="Select" className="p-column-filter" showClear  />
        );
    };

    const statusRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '3em' }} value={options.name} optionValue="code" optionLabel="name"  options={globalFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={flagTemplate} placeholder="Select One" className="p-column-filter" showClear  />
        );
    };
    const flagTemplate = (option) => {
        return <Badge value={option.name} severity={getSeverity(option.name)} />;
    };
    const getSeverity = (status) => {
        
        switch (status) {
            case 'Yes':
                return 'success';

            case 'No':
                return 'danger';
            case 'Count with Issue':
                return 'danger';
            case 'System Adj.':
                return 'info';
            case 'Manual Adj.':
                return 'primary';
            case 'NotPerformed':
                return 'warning';
            default:
                return 'primary'

        }
    };
    const globalFlags = [
        { code: 'Y', name: 'Yes' },
        { code: 'N', name: 'No' },
    ];
    const statusRowFilterTemplate1 = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '3em' }} value={options.name} optionValue="code" optionLabel="name"  options={globalFlags1} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={flagTemplate1} placeholder="Select One" className="p-column-filter" showClear  />
        );
    };
    const flagTemplate1 = (option) => {
        return <Badge value={option.name} severity={getSeverity1(option.name)} />;
    };
    const getSeverity1 = (flag) => {
        switch (flag) {
            case 'Yes':
                return 'success';

            case 'No':
                return 'danger';
        }
    };
    const globalFlags1 = [
        { code: '1', name: 'Yes' },
        { code: 'Null', name: 'No' },
    ];
    const [displayConfirmation6, setDisplayConfirmation6] = useState(false);
    const [displayConfirmation1, setDisplayConfirmation1] = useState(false);
    const [displayConfirmation2, setDisplayConfirmation2] = useState(false);

    const getUsercycle= () => {
       setcountlabel(selectedUsers[0].count_name )
        CountService.getSecondUser((selectedUsers[0])).then((data) => {
            setSecondUserDropDown(data.data); 
        }).catch((error) => {
            console.error('Error fetching users:', error);
        });

    };
    const handleClick = () => {
        setDisplayConfirmation1(true);
        getUsercycle();
      };

 
    const actionItems = [
        {
            label: 'Create Count',
            icon: "pi pi-plus",
            command: () => {
                
                    onclick(navigate("/count/create"))
                
            }
        },
        { label: 'Assign to count for 2nd/3rd Cycle count',
            icon: 'pi pi-plus',
            command: () => {
                if(selectedUsers.length > 1 ){
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select only one row.' });}
                else if(selectedUsers != null && selectedUsers.length == 1 ){
                    setbtnDisabled(true) 
                    onclick(setDisplayConfirmation6(true))
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 count' });
                }
            }},
        { label: 'Re-Assign count',
            icon: 'pi pi-plus',
            command: () => {
                if(selectedUsers.length > 1 ){
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select only one row.' });}
                else if(selectedUsers != null && selectedUsers.length == 1 ){
                    setbtnDisabled(true) 
                     document.addEventListener('click', handleClick, { once: true });
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 count' });
                }
            }
        },
         {
            label: 'System Adjustment',
            icon: 'fa fa-gear',
            command: () => {
               
                if(selectedUsers != null && selectedUsers.length > 0){
                    // if(selectedItem.length > 1 ){
                    //     toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select only one row.' });
                    // }else{ }

                    setbtnDisabled(false) 
                    onclick(setDisplayConfirmation2(true))
                
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        }
    ];

        
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                <Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />
               
            </span>
            
        </div>
    );
    const handleAisleChange = (e) => {
        const aisleValue = selectedUsers[0].Aisle.toUpperCase();
        const level = selectedUsers[0].Level;

        let countName = aisleValue ? `${aisleValue}-${level}(2)`.toUpperCase() : ''; 
        console.log(countName);

        // Ensure count_name is compared in uppercase
        if (new RegExp(`^${aisleValue}-${level}\\(2\\).*$`).test(selectedUsers[0].count_name.toUpperCase())) {
            countName = `${aisleValue}-${level}(3)`.toUpperCase();
        }

        // Set value in uppercase for the form
        form.setValue('defaultCountName', countName);
 
      };
    const onSubmitCount = (data) => {
        const formValues = form.getValues();
        const SecondCountName = formValues.defaultCountName; 
        const SecondUser = formValues.User;
        data = {
            SecondUser,
            SecondCountName,
            selectedUsers:selectedUsers[0]
        }
        // console.log(selectedUsers);
        setLoading(true);
        // CountService.ValidateParentCount(selectedUsers.count_Id).then((response) => {
         
        //     if (response.error == 0 ) {

                CountService.CreateSecondCount(data).then((data) => {
                    setLoading(false);
                    if (data.error == 0) {
                        toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                        form.reset();
                        loadLazyData();
                        setbtnDisabled(false);
                        setDisplayConfirmation6(false);
                    } else {
                        toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
                    }
                    
                });
        
    };
    
    const onSubmitReassign = (data) => {

        const formValues = form.getValues();
        const User = formValues.User;
        data = {
            User,
            selectedUsers:selectedUsers[0]
        }
         console.log(data);
        setLoading(true);
                CountService.UpdateAssignTo(data).then((data) => {
                    setLoading(false);
                    if (data.error == 0) {
                        toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                        form.reset();
                        loadLazyData();
                    } else {
                        form.reset();
                        toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
                    }
                    setbtnDisabled(false);
                    setDisplayConfirmation1(false);
                });
    }
    const confirmationDialogFooter6 = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitCount()} />
        </div>
    );
    const confirmationDialogFooter1 = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitReassign()} />
        </div>
    );

    const confirmationDialogFooter2 = (
        <>
            <Button type="button" label="No" disabled={btnDisabled} icon="pi pi-times" onClick={() => setDisplayConfirmation2(false)} className="p-button-text" />
            <Button type="button" label="Yes" disabled={btnDisabled} icon="pi pi-check" onClick={() => markSystemAdjustment()} className="p-button-text" autoFocus />
        </>
    );

    
    const getCountDetail = (id) => {
        setid(id);
        const data = {
            id:id,
            lazyStatedetail};
            setCountDetail(null)
            setcountDetailModel(true)
        setLoadingDetail(true);
        CountService.GetCountDetails( (data) ).then((data) => {
            setCountDetail(data.data);
            setTotalRecords1(data.totalRecords);
            
            
        }).finally(setLoadingDetail(false));
    }
    const cancleModel = () => {
        setCountDetail(null)
        setcountDetailModel(false);
        setid(null);
        
    }
    useEffect(() => {
       
        if (id) {
            getCountDetail(id); 
          }
      }, [lazyStatedetail]); 
    const markSystemAdjustment = () => {
        setLoading(true);
        setbtnDisabled(true);
        const countIds = selectedUsers.map(user => user.count_Id);
        const data = {
            count:countIds,
        }
        // console.log(data)
        CountDetails.markSystemAdjustment( (data) ).then((data) => {
            setLoading(false);
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                loadLazyData();
                setSelectAll(false);
                setSelectedUsers(null);
                setDisplayConfirmation2(false)
            } 
            else{
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setbtnDisabled(false);
            setDisplayConfirmation2(false)
        });
    }
    const adjustmentTypeBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.adjustment_type == 1) ? 'System': (rowData.adjustment_type == 2) ? 'Manual': ''}
            </>
        );
    };
    const adjustmentBodyTemplate1 = (rowData) => {
        return (
            <>
                {(rowData.adjustment == null) ? '': rowData.adjustment }
            </>
        );}
    
    return (
        <>
        <Helmet>
            <title>Count</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />

        <Dialog header="Count Detail " receivingModel  visible={countDetailModel} style={{ width: '70vw'}}
         position='center' onHide={() => {if (!countDetailModel) return; cancleModel(); }}
         >
                    {(!CountDetail) ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <ProgressSpinner />
                        </div>
                    ) : (
                        <div className="card p-0 " >
                            <DataTable removableSort 
                            value={CountDetail} 
                            lazy 
                            className="datatable-responsive" 
                            emptyMessage="No records found." 
                            paginator
                            filterDisplay="row" 
                            showGridlines 
                            sort 
                            first={lazyStatedetail.first} 
                            rows={lazyStatedetail.rows} 
                            totalRecords={totalRecords1} 
                            onPage={onPage1}
                            onSort={onSort1} 
                            size={'small'}
                            sortField={lazyStatedetail.sortField}    
                            sortOrder={lazyStatedetail.sortOrder}
                            onFilter={onFilter1} 
                            filters={lazyStatedetail.filters} 
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                            tableStyle={{ minWidth: '70rem' }} 
                            stripedRows 
                            loading={loadingDetail} scrollable scrollHeight="600px" 
                            >
                                <Column/>
                                <Column header="Item Code " field="Item_Code"    body={(data) => data.Item_Code} sortable showFilterMenu={false} filter filterPlaceholder="Search"   />
                                <Column header="Location Code" field="location_Code"    body={(data) => data.location_Code} sortable showFilterMenu={false} filter filterPlaceholder="Search"   />
                                <Column header="Adjustment type" field="adjustment_type"   body={adjustmentBodyTemplate} sortable showFilterMenu={false} filter filterPlaceholder="Search"  />
                                <Column  header="Not Match"  field="not_match"   body={(data) => data.not_match} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                            </DataTable>
                        </div>
                    )}

        </Dialog>
        <Dialog header="Confirmation" visible={displayConfirmation2} onHide={() => setDisplayConfirmation2(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter2}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>
        <Dialog header="Create Count" visible={displayConfirmation6} style={{ width: '50vw' }} onHide={() =>{
            setDisplayConfirmation6(false);
            form.reset();
        }} footer={confirmationDialogFooter6}>
                <div className="p-fluid formgrid grid">
                <div className="field col-12 md:col-4">
                                    <Controller
                                        name="User"
                                        control={form.control}
                                         rules={{ required: 'User is required.' }}
                                        render={({ field, fieldState }) => (
                                        <>
                                            <label>User*</label>
                                            <Dropdown
                                            id={field.name}
                                            value={field.value}
                                            key={field.name}
                                            editable
                                            optionValue="usr_ID" 
                                            optionLabel="name"
                                            onChange={(e) =>{ field.onChange(e.target.value),handleAisleChange(e),setbtnDisabled(false)}}
                                            options={UserDropDown}
                                            placeholder="Select a User"
                                            className={classNames({ 'p-invalid': fieldState.error })}
                                            />
                                            {getFormErrorMessage(field.name)}
                                        </>
                                        )}
                                    />
                                    </div>
                    <div className="field col-12 md:col-4">
                        <Controller
                                    name="defaultCountName"
                                    control={form.control}
                                    rules={{ 
                                        required: 'CountName is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <label>Count Name*</label>
                                            <InputText id={field.name} value={field.value || ''}  type="text" className={classNames({ 'p-invalid': fieldState.error })}  onChange={(e) => {
                                        field.onChange(e.target.value.toUpperCase());
                                        
                                        }}
                                             />
                                            {getFormErrorMessage(field.name)}
                                        </>
                                    )}
                                />     
                                 
                    </div>
                    
                </div>
            </Dialog>
        <Dialog header="Re-Assign Count" visible={displayConfirmation1} style={{ width: '50vw' }} onHide={() => {
            setDisplayConfirmation1(false);
            form.reset();
        }} footer={confirmationDialogFooter1}>
                <div className="p-fluid formgrid grid">
                <div className="field col-12 md:col-4">
                                    <Controller
                                        name="User"
                                        control={form.control}
                                         rules={{ required: 'User is required.' }}
                                        render={({ field, fieldState }) => (
                                        <>
                                            <label>User*</label>
                                            <Dropdown
                                            id={field.name}
                                            value={field.value}
                                            key={field.name}
                                            editable
                                            optionValue="usr_ID" 
                                            optionLabel="name"
                                            onChange={(e) =>{ field.onChange(e.target.value),setbtnDisabled(false)}}
                                            options={SecondUserDropDown}
                                            placeholder="Select a User"
                                            className={classNames({ 'p-invalid': fieldState.error })}
                                            />
                                            {getFormErrorMessage(field.name)}
                                        </>
                                        )}
                                    />
                                    </div>
                             
                                   <div className="field col-12 md:col-4">
                                    <label htmlFor="CountName">Count Name*</label><br />
                                    <span style={{ fontSize: '18px', marginTop: '10px', display: 'inline-block',marginLeft:'5px' }}>{countlabel}</span>
                                </div>
                    
                    
                </div>
            </Dialog>
        
        
        <h1></h1>
        <div className="card">
            <h3>Count</h3>
            <DataTable 
                value={users} 
                lazy 
                filterDisplay="row" 
                dataKey="count_Id" 
                paginator
                showGridlines
                first={lazyState.first} 
                rows={lazyState.rows} 
                totalRecords={totalRecords} 
                onPage={onPage}
                onSort={onSort} 
                size={'small'}
                sortField={lazyState.sortField}    
                className="datatable-responsive"
                sortOrder={lazyState.sortOrder}
                onFilter={onFilter} 
                filters={lazyState.filters} 
                rowsPerPageOptions={[10, 25, 50, 100]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                loading={loading} 
                tableStyle={{ minWidth: '75rem' }}
                emptyMessage="No records found."
                selection={selectedUsers} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                header={header}
                scrollable 
                scrollHeight="600px"
                removableSort
            >   
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />  
                {/* <Column field="count_Id" header="count_Id" body={(rowData) => rowData.count_Id} sortable showFilterMenu={false} filter filterPlaceholder="Search" /> */}
                <Column field="count_name" header="Count Name" body={(rowData) => rowData.count_name} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="Aisle" header="Aisle" body={(rowData) => rowData.Aisle} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="Level" header="Level" body={(rowData) => rowData.Level} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="UPC" header="UPC" body={UPCBodyTemplate} sortable showFilterMenu={false} filter filterElement={statusRowFilterTemplate} />
                <Column field="Exp" header="Expiry" body={ExpBodyTemplate} sortable showFilterMenu={false} filter filterElement={statusRowFilterTemplate} />
                <Column field="created_at" header="Created At" body={(rowData) => rowData.created_at_formatted} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="updated_at" header="Updated At" body={(rowData) => rowData.updated_at_formatted} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="AssignedToUser" header="Assigned To" body={(rowData) => rowData.AssignedToUser} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="CreatedByUser" header="Created By" body={(rowData) => rowData.CreatedByUser } sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="TotalLocation" header="Total Location" body={(rowData) => rowData.TotalLocation } sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="LocationPerformed" header="Count Performed" body={(rowData) => rowData.LocationPerformed } sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="quantity" header="Quantity" body={quantityBodyTemplate} sortable showFilterMenu={false} filter filterElement={statusRowFilterTemplate} />
                <Column field="close_count" header="Close Count" body={close_countBodyTemplate} sortable showFilterMenu={false} filter filterElement={statusRowFilterTemplate1} />
                
                <Column field="Parent_CountId" header="Parent Count ID" body={(rowData) => rowData.Parent_CountId } sortable showFilterMenu={false} filter filterPlaceholder="Search"/>
                <Column field="Rerun_count" header="Rerun Count" body={Rerun_countBodyTemplate } sortable showFilterMenu={false} filter filterElement={statusRowFilterTemplate1} />
                <Column field="adjustment_type" header="Adjustment Type" body={adjustmentTypeBodyTemplate }   />
                <Column field="adjustment" header="Adjustment " body={adjustmentBodyTemplate1} />
                {/* <Column header="View Detail"   field="outer_QTY"  headerStyle={{ width: '8%', minWidth: '6rem' }}   body={(data) => (
                    <Button label="View" severity="info" size="small" outlined  onClick={() => getCountDetail(data.count_Id)}/>
                )}/> */}
            </DataTable>
        </div>
        </>
        
    );
}
        