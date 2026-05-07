
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
import { ZoneService } from '../../../../service/operations/ZoneService';
import { ItemLotExpiryService } from '../../../../service/operations/ItemLotExpiryService';
import { useLazySort } from '../../../../components/useLazySort';
import { useAuth } from '../../../../store/useAuth';


export default function ItemLotExp() {
    const {hasActionAccess} = useAuth();
    const PAGE_KEY = "operations_itemLotExp";
    const {hasPageAccess} = useAuth();
    const Detail_PAGE_KEY = "Item_lot_expiry_details";

    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [item, setItem] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const toast = useRef();
    const navigate = useNavigate();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            warehouse: { value: null, matchMode: 'contains' },
            // item: { value: null, matchMode: 'contains' },
            lot_number: { value: null, matchMode: 'contains' },
            exp_date: { value: null, matchMode: 'contains' },
            first_receipt_date: { value: null, matchMode: 'contains' },
            sav_Value: { value: null, matchMode: 'contains' },
            prd_PrimaryCode:{ value: null, matchMode: 'contains' }
        }
    });
            const { onSort } = useLazySort(setlazyState);
    

    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)

    const dispatch = useDispatch()


    const items = [{ label: 'Stock' }, { label: 'Item Lot Expiry'}];
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

        networkTimeout = setTimeout(() => {
            ItemLotExpiryService.getGrid( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setItem(data.data.map((row, index) => ({ ...row, uniqueKey: index + 1 })));
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
    };

    const onPage = (event) => {
        setlazyState(event);
    };


    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };

    const onSelectionChange = (event) => {
        const value = event.value;

        setSelectedItem(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            ItemLotExpiryService.getGrid().then((data) => {
                setSelectAll(true);
                setSelectedItem(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedItem([]);
        }
    };

    const warehouseBodyTemplate = (rowData) => {
        return (
            <>{rowData.warehouse}</>
        );
    };

    // const itemBodyTemplate = (rowData) => {
    //     return (
    //         <Link to={`${rowData.id}`}>{rowData.prd_PrimaryCode}</Link>
    //     );
    // };

    const itemBodyTemplate = (rowData) => {
    const hasDetailAccess = hasPageAccess(Detail_PAGE_KEY);

    return hasDetailAccess ? (
        <Link to={`${rowData.id}`}>{rowData.prd_PrimaryCode}</Link>
    ) : (
        <span>{rowData.prd_PrimaryCode}</span>
    );
}; 
    

    const lot_numberBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.sav_Value}
            </>
        );
    };
    const exp_dateBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.exp_date}
            </>
        );
    };
    const first_receipt_dateBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.first_receipt_date}
            </>
        );
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
            {hasActionAccess(PAGE_KEY,"add")&&(<Button label="Add" icon="pi pi-plus" severity="sucess" onClick={() => navigate("/operations/item-lot-expiry/add")} />)}
            </span>
        </div>
    );



    return (
        <>
        <Helmet>
            <title>Item Lot Expiry | Sagis</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
      
        <h1></h1>
        <div className="card">
            <h3>Items</h3>
            <DataTable 
                value={item} 
                lazy 
                filterDisplay="row" 
                dataKey="uniqueKey" 
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
                rowsPerPageOptions={[25, 50, 100, 500, 1000, 5000]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                loading={loading} 
                tableStyle={{ minWidth: '75rem' }}
                emptyMessage="No records found."
                selection={selectedItem} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                header={header}
                scrollable 
                scrollHeight="600px"
                
            >
                <Column field="prd_PrimaryCode" sortable header="Item" body={itemBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                {/* <Column field="warehouse" header="Warehouse" body={warehouseBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" /> */}
                <Column field="sav_Value" sortable header="Lot Number" body={lot_numberBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />  
                <Column field="exp_date" header="Exp Date" body={exp_dateBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="first_receipt_date" sortable header="First Receipt Date" body={first_receipt_dateBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />         
            </DataTable>
        </div>
        </>
        
    );
}
        