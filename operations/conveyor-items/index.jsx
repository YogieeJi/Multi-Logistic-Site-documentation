
import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Dialog } from 'primereact/dialog';
import { Controller, useForm } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { PendingReceiptService } from '../../../service/inbound/PendingReceiptService';
import { ConveyorItemsService } from '../../../service/operations/ConveyorItemsService.';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { BreadCrumb } from 'primereact/breadcrumb';



export default function ConveyorItems() {
    const [loading, setLoading] = useState(false);
    let networkTimeout = null;
    const params = useParams();
    const toast = useRef(null);
    const [totalRecords, setTotalRecords] = useState(0);
    const [dropdownPRList, setDropdownPRList] = useState(null);
    const [slotdetails, setslotdetails] = useState(null);
    const [itemsDropdownlist, setItemsDropdownlist] = useState(null);
    const [assigningData, setAssigningData] = useState({});
    const [dialog1visible, setDialog1Visible] = useState(false);
    const [btnDisabled, setbtnDisabled] = useState(false);
    const [selectedItemTitle, setSelectedItemTitle] = useState(false);
    const [selectedItemUpc, setSelectedItemUpc] = useState(false);

    let defaultValues = { 
        pending_receipts: '',
    };

    let data = {};

    const form = useForm({ defaultValues });
    const errors = form.formState.errors;

    const [gridHidden, setGridHidden] = useState(true);

    let list = [];
 const items = [{ label: 'Conveyor' }, { label: 'Conveyor Items'}];
    const home = { icon: 'pi pi-home', url: '/' }

    useEffect(() => {
        loadLazyData();
    }, []);

    const loadLazyData = () => {
        PendingReceiptService.getPendingReceiptList().then((data) => {
            if((data.Data).length > 0){
                list = data.Data.map((a) => ({ label: a.rct_Code, value: a.rct_ID }));
                setDropdownPRList(list)
            } 
        });
    };
  
    const onLoad = (data) => {
        setLoading(true);
        setGridHidden(true);

        data = {
            pending_receipts: form.getValues('pending_receipts')
        }

        ConveyorItemsService.loadItems( (data) ).then((data) => {
            setLoading(false);
            if(data.error == 0){
                setslotdetails(data.slots);
                setItemsDropdownlist(data.items.Data);
                setTotalRecords(data.totalRecords);
                setGridHidden(false);
            } else{
                toast.current.show({ severity: 'error', summary: 'Search Error', detail: data.message});
            }
        });
    };

    const getFormErrorMessage = (name) => {
        return errors[name] ? <small className="p-error">{errors[name].message}</small> : null;
    };

    const titleBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.title}
            </>
        );
    };

    const itemBodyTemplate = (rowData) => {
        return (
            <>
                {((rowData.conveyor_item).length > 0) ? rowData.conveyor_item[0]['title'] : '-'}
            </>
        );
    };

    const actionBodyTemplate = (rowData) => {
        if(rowData.tsk_Code == null){
            return (<Button type="button" onClick={()=>assignItemPopup(rowData.id)} icon="pi pi-plus" rounded></Button>);
        }
    };


    const assignItemPopup = (slotID) => {
        setAssigningData({
            pending_receipt: form.getValues('pending_receipts'),
            slotID,
        })
        setDialog1Visible(true)
    }

    const dialog1footerContent = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitItem()} />
        </div>
    );

    const onSubmitItem = () => {

        
        if(selectedItemUpc == ''){
            toast.current.show({ severity: 'error', summary: 'Validation Error', detail: 'Please select an Item'});
        } else{
            setbtnDisabled(true);
            data = {
                title: selectedItemTitle,
                upc: selectedItemUpc,
                slot_id: assigningData.slotID,
                ci_ReceiptID: assigningData.pending_receipt
            }
            // console.log(data)
            ConveyorItemsService.assignItem( (data) ).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                    setSelectedItemUpc('');
                    setSelectedItemUpc('');
                    // getItems(zoneDetail.zon_Description);
                } 
                else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
                }
                setbtnDisabled(false);
                setDialog1Visible(false)
                onLoad();
            });
        }
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                
            </div>
            <Dialog header="Assign Item" visible={dialog1visible} style={{ width: '50vw' }} onHide={() => setDialog1Visible(false)} footer={dialog1footerContent}>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-9">
                        <label>Items*</label>
                        <Dropdown 
                            style={{marginRight:5, marginLeft:10}} 
                            value={selectedItemUpc}
                            optionValue="pbc_String" 
                            optionLabel="prdl_Description" 
                            onChange={(e) => {
                                setSelectedItemUpc(e.value)
                                const ob = itemsDropdownlist.find((o) => o.pbc_String == e.value);
                                setSelectedItemTitle(ob.prd_PrimaryCode);
                                
                            }} 
                            options={itemsDropdownlist} 
                            placeholder="Select Item"  
                            filter={true}
                        />
                    </div>
                </div>
            </Dialog>
            <h1></h1>
            <Toast ref={toast} />
            <BreadCrumb model={items} home={home} />

            <form onSubmit={form.handleSubmit(onLoad)} className="mt-4">
                <div className="card">
                    <h3>Conveyor Items</h3>
                    <h1></h1>
                    <div className="p-fluid formgrid grid">
                       <div className="field col-12 md:col-4">
                            <Controller
                                name="pending_receipts"
                                control={form.control}
                                rules={{ 
                                    required: 'Pending Receipt is required.'
                                }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <label>Pending Receipt</label>
                                        <Dropdown id={field.name} value={field.value} key={field.name} style={{marginRight:5, marginLeft:10}} optionValue="value" optionLabel="label" onChange={(e) => field.onChange(e.target.value)} options={dropdownPRList} placeholder="Select" className={classNames({ 'p-invalid': fieldState.error })} />
                                        {getFormErrorMessage(field.name)}
                                    </>
                                )}
                            />
                        </div>
                    </div>
                    <Button label="Load" loading={loading} type='submit' className="w-3 mt-3" ></Button>
                </div>
            </form>

            <div className="card" hidden={gridHidden}>
                <h3>Slot Details</h3>
                <h1></h1>
                <DataTable
                    value={slotdetails}
                    lazy
                    dataKey="id"
                    showGridlines
                    totalRecords={totalRecords}
                    size={'small'}
                    className="datatable-responsive mb-6"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    loading={loading}
                    tableStyle={{ minWidth: '70rem' }}
                    emptyMessage="No records found."

                    scrollable
                    scrollHeight="600px"
                >

                    <Column field="Slot" header="Slot" body={titleBodyTemplate} headerStyle={{ width: '4rem' }}   />
                    <Column field="Item" header="Item" headerStyle={{ width: '4rem' }} body={itemBodyTemplate}    />

                    <Column header="Assign Item" headerStyle={{ width: '10px', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />

                </DataTable>
            </div>

        </>

    );
}
