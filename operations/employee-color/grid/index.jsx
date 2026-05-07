
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
import { EmployeeColorService } from '../../../../service/operations/EmployeeColorService';
import { useAuth } from '../../../../store/useAuth';



export default function EmployeeColor() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [employees, setEmployees] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedEmployees, setSelectedEmployees] = useState(null);
    const toast = useRef();
    const navigate = useNavigate();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            color: { value: null, matchMode: 'contains' },
            usr_Login: { value: null, matchMode: 'contains' },
        }
    });
     const { hasActionAccess, hasPageAccess } = useAuth();
     const PAGE_KEY = "operations_employeeColor";
     const Detail_PAGE_KEY = "Employee_Color_details";
    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)

    const dispatch = useDispatch()


    const items = [{ label: 'Conveyor' }, { label: 'Employee Color'}];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;


    useEffect(() => {
        if(formMessageDetail != ''){
            toast.current.show({ severity: formMessageSeverity, summary: formMessageSummary, detail: formMessageDetail});
            dispatch(removeData());
        }
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            EmployeeColorService.getGrid( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setEmployees(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
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

    const onSelectionChange = (event) => {
        const value = event.value;

        setSelectedEmployees(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            EmployeeColorService.getGrid().then((data) => {
                setSelectAll(true);
                setSelectedEmployees(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedEmployees([]);
        }
    };

    // const colorBodyTemplate = (rowData) => {
    //     return (
    //         <>
    //             <span className="p-column-title">Color</span>
    //             <Link to={`${rowData.id}`}>{rowData.color}</Link>
    //         </>
    //     );
    // };
    const colorBodyTemplate = (rowData) => {
    const hasAccess = hasPageAccess(Detail_PAGE_KEY);

    return (
        <>
            <span className="p-column-title">Color</span>

            {hasAccess ? (
                <Link to={`${rowData.id}`}>
                    {rowData.color}
                </Link>
            ) : (
                <span>
                    {rowData.color}
                </span>
            )}
        </>
    );
};

    const mantis_idBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.usr_Login}
            </>
        );
    };
   

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            { <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                {hasActionAccess(PAGE_KEY, "add_user_color") &&(<Button label="Add Users" icon="pi pi-plus" severity="sucess" onClick={() => navigate("/operations/employee-color/add")} />)}
            </span> }
            
        </div>
    );


    return (
        <>
        <Helmet>
            <title>Employee Color</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
        
        <h1></h1>
        <div className="card">
            <h3>Employee Color</h3>
            <DataTable 
                value={employees} 
                lazy 
                filterDisplay="row" 
                dataKey="id" 
                paginator
                showGridlines
                first={lazyState.first} 
                rows={lazyState.rows} 
                totalRecords={totalRecords} 
                 onPage={onPage}
                // onSort={onSort} 
                size={'small'}
                sortField={lazyState.sortField}    
                className="datatable-responsive"
                sortOrder={lazyState.sortOrder}
                // onFilter={onFilter} 
                // filters={lazyState.filters} 
                rowsPerPageOptions={[25, 50, 100, 500, 1000]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                loading={loading} 
                tableStyle={{ minWidth: '65rem' }}
                emptyMessage="No records found."
                // selection={selectedEmployees} 
                // onSelectionChange={onSelectionChange} 
                // selectAll={selectAll} 
                // onSelectAllChange={onSelectAllChange}
                header={header}
                scrollable 
                scrollHeight="600px"
                // removableSort
            >
                {/* <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} /> */}
           
                <Column field="color" header="Color" body={colorBodyTemplate}  />
                <Column field="usr_Login" header="User" body={mantis_idBodyTemplate} />

            </DataTable>
        </div>
        </>
        
    );
}
        