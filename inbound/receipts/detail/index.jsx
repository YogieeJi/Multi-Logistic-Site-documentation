
import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { ReceiptsService } from '../../../../service/inbound/ReceiptService';
import { Dialog } from 'primereact/dialog';
import '../../../../assets/styles.css';

export default function ReceiptDetails() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [receipt, setReceipt] = useState(null);
    const [receiptDetail, setReceiptDetail] = useState({
        'created_at':'-',
        'fcy': '-'
    });

    const [receiptLines, setReceiptLines] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedReceipts, setSelectedReceipts] = useState(null);
    const [visibleRight, setVisibleRight] = useState(false);

    const [statusValue, setStatusValue] = useState(null);

    const [dates, setDates] = useState(null);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: {
            prd_PrimaryCode: { value: '', matchMode: 'contains' },
            lsp_Quantity: { value: '', matchMode: 'contains' },
            qtyuom: { value: '', matchMode: 'contains' },
            ActualPackType: { value: '', matchMode: 'contains' },
            InputPackType: { value: '', matchMode: 'contains' },

        }
    });

    const [logs, setLogs] = useState(null);
    const [visible, setVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');

    const getSeverity = (status) => {
        switch (status) {
            case 1:
                return 'info';

            case 2:
                return 'warning';

            case 3:
                return 'success';
        }
    };

    const reactRouterLink = (label, url) => {
        return (<Link to={url}>{label}</Link>);
    }

    const items = [{ label: 'Inbound' }, {  template: reactRouterLink('Receipt','/inbound/receipts')}];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;
    const params = useParams();

    
    
    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    

    const loadLazyData = () => {
        const data = { id : params.id}
        
        ReceiptsService.getReceipt( (data,params.id)).then((data) => {
            
            setReceiptDetail(data.data);
        });
        
        setLoading(true);


        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            ReceiptsService.getReceiptDetailGrid( params.id,(lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setReceiptLines(data.data);
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

        setSelectedContainers(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            ReceiptsService.getReceiptLines(params.id).then((data) => {
                setSelectAll(true);
                setSelectedReceipts(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedReceipts([]);
        }
    };

    const pohnumBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.pohnum}
            </>
        );
    };

    const poplinBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.poplin}
            </>
        );
    };

    const itmrefDateBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.itmref}
            </>
        );
    };

    const qtyBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.qty}
            </>
        );
    };

    const lot_detailsBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.lot_details}
            </>
        );
    };

    const syncDetails = () => {
        // dt.current.exportCSV();
        console.log(selectedShipments);
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <Button label="Sync Details" icon="pi pi-sync" severity="sucess" onClick={syncDetails} />
            </span>
        </div>
    );

    const readMorePopup = (e, item, event) => {
        e.preventDefault();
        setVisible(true);
        let text = '';
        if(item.data){
            text += '<h5>Below data created</h5>';
            let keys = Object.keys(item.data);
            keys.forEach((key) => {
                text += key+' = '+item.data[key]+"<br>"
            });
        } else if(event == 'sync'){
            text += '<h5>Request</h5>';
            text += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">'+item.request+'</meta>';
            text += '<br><h5>Response</h5>';
            text += JSON.stringify(item.response);
        } else if (event == 'error'){
            text += '<h5>Exception</h5>';
            text += item.error;
        }
       setDialogText(text)
    }



    const customizedContent = (item) => {
        let causerName = item.causer_id ? item.causer_name : 'System';
        let date = new Date(item.created_at);
        return (
            <div className='timeline_content'>
                <div className='main_line'>
                    <p><span style={{fontWeight:'bold'}}>{date.getFullYear()+'-'+date.getMonth()+'-'+date.getDate()+' '+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds()}</span> - {item.description}...</p>
                    <a href='' onClick={(e) => readMorePopup(e, item.properties, item.event)}>read more</a>

                </div>
                <div className='secondary_line'>
                    <p>By <span style={{fontWeight:'bold'}}>{causerName}</span></p>
                    <Button label={item.event.toUpperCase()} className={item.event == 'created' ? 'status_btn  btn_success' : (item.event == 'error') ? 'status_btn  btn_danger' : 'status_btn  btn_info'}></Button>
                </div>
                
            </div>
        );
    };
    const rowClassName = (rowData) => {
     
        return {
            'row-red': parseInt(rowData.qtyuom) != rowData.lsp_Quantity,
            'row-success': parseInt(rowData.qtyuom) == rowData.lsp_Quantity
        };
    };


    return (
        <>
            <BreadCrumb model={items} home={home} />
           
            

            <Dialog header="Log Detail" visible={visible} style={{ width: '50vw' }} onHide={() => setVisible(false)}>
                <p className="m-0" dangerouslySetInnerHTML={{__html: dialogText}}>
                </p>
            </Dialog>
            <div className="card">
            {/* <h3>Rececipt</h3> */}
            <h1></h1>
                    <div className="p-fluid formgrid grid">
                        <div className="field col-12 md:col-4">
                            <h5 id="warehouse">Receipt Number</h5>
                            <p htmlFor="warehouse">{receiptDetail.rct_code}</p>
                        </div>
                        <div className="field col-12 md:col-4">
                            <h5 id="created_at">Created At</h5>
                            <p htmlFor="created_at">{receiptDetail.rct_inputDate}</p>
                            
                        </div>
                    </div>
            </div>
            <div className="card">
                <h3>Expected vs Received Receipt QTY Report</h3>
                <h1></h1>
                <DataTable 
                    value={receiptLines} 
                    lazy 
                    filterDisplay="row" 
                    dataKey="id" 
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
                    rowsPerPageOptions={[25, 50, 100, 500]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    loading={loading} 
                    tableStyle={{ minWidth: '75rem' }}
                    emptyMessage="No data found."
                    selection={selectedReceipts} 
                    onSelectionChange={onSelectionChange} 
                    selectAll={selectAll} 
                    onSelectAllChange={onSelectAllChange}
                    scrollable 
                    scrollHeight="600px"
                    removableSort
                    rowClassName={rowClassName}
                >
                    <Column></Column>
            
                    <Column field="prd_PrimaryCode" header="Code" body={(rowData) => rowData.prd_PrimaryCode} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="lsp_Quantity" sortable header="Expected Qty" body={(rowData) => parseInt(rowData.lsp_Quantity) }  />
                    <Column field="qtyuom"  header="Actual Qty" body={(rowData) => parseInt(rowData.qtyuom)}  />
                    <Column field="ActualPackType" header="Actual Pack Type" body={(rowData) => rowData.ActualPackType}  showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="InputPackType" header="Input Pack Type" body={(rowData) => rowData.InputPackType}  showFilterMenu={false} filter filterPlaceholder="Search" />
                   
                </DataTable>
            </div>
        </>
       
    );
}
        