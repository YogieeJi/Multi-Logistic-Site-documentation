
import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';
import { Sidebar } from 'primereact/sidebar';
import { Timeline } from 'primereact/timeline';
import { Dialog } from 'primereact/dialog';
import { TabPanel, TabView } from 'primereact/tabview';
import { Controller, useForm } from 'react-hook-form';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { BreadCrumb } from 'primereact/breadcrumb';
import { TruckDetailsService } from '../../../service/trucks/TruckDetailsService';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';

export default function TruckDetails() {
    const [loadingBtn1, setLoadingBtn1] = useState(false);
    const [loadingBtn2, setLoadingBtn2] = useState(false);
    const [tabDisable, setTabDisable] = useState(false);
    const toast = useRef(null);
    const [dropdownTruckList, setDropdownTruckList] = useState(null);



    const [lazyState, setlazyState] = useState();

   
    const [visible, setVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');

    let defaultValues = { 
        truck_ref: ''
    };

    const form = useForm({ defaultValues });
    const errors = form.formState.errors;

   
    const params = useParams();

    const items = [{ label: 'Shipment' }, { label: 'Truck Details'}];
    const home = { icon: 'pi pi-home', url: '/' }
    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    let list = [];

    const loadLazyData = () => {
        TruckDetailsService.getTruckList().then((data) => {
            if(data.error == 0){
                form.reset();
                list = data.data.map((a) => ({ label: a.truckRef, value: a.truckRef }));
                setDropdownTruckList(list)
            } 
        });
    };

    const getFormErrorMessage = (name) => {
        return errors[name] ? <small className="p-error">{errors[name].message}</small> : null;
    };

    const onSubmitTruck = (data) => {
        setLoadingBtn2(true);
        setTabDisable(true);

        data = {
            truck_ref: form.getValues('truck_ref'),
        }

        TruckDetailsService.getTruckDetail( (data) ).then((data) => {
            setLoadingBtn2(false);
            setTabDisable(false);
            if(data.error == 0){
                form.reset();
                // Dynamically get API base URL
                const baseApiUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, ''); 
                const downloadUrl = `${baseApiUrl}${data.data}`;  
                //  open in new tab (for viewing or downloading)
                window.open(downloadUrl, "_blank");
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
            } else{
                toast.current?.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
        });
    };

    const onSubmitAll = () => {
        setLoadingBtn1(true);
        setTabDisable(true);
        TruckDetailsService.getAllTrucksDetails().then((data) => {
            setLoadingBtn1(false);
            setTabDisable(false);
            if(data.error == 0){
                form.reset();
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});

                //  Dynamically get API base URL
                const baseApiUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, ''); 
                const downloadUrl = `${baseApiUrl}${data.data}`;  
                //  open in new tab (for viewing or downloading)
                window.open(downloadUrl, "_blank");
            } else{
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
        });
    };
   

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                
            </div>
            <h1></h1>
            <Toast ref={toast} />
            <Dialog header="Log Detail" visible={visible} style={{ width: '50vw' }} onHide={() => setVisible(false)}>
                <p className="m-0" dangerouslySetInnerHTML={{__html: dialogText}}>
                </p>
            </Dialog>
             <BreadCrumb model={items} home={home} />
            <div className="card mt-4">
                <h3>Truck Details </h3>
                <TabView>
                    <TabPanel header="Get All Trucks" disabled={tabDisable}>
                        <p className="m-0">
                           Download all the truck details.
                        </p>
                        <Button label="Download" loading={loadingBtn1}  onClick={onSubmitAll} className="w-3 mt-3" ></Button>
                    </TabPanel>
                    <TabPanel header="Get Truck Details" disabled={tabDisable}>
                        <form onSubmit={form.handleSubmit(onSubmitTruck)} className="">
                            <div className="p-fluid formgrid grid">
                                <div className="field col-12 md:col-4">
                                    <Controller
                                        name="truck_ref"
                                        control={form.control}
                                        rules={{ 
                                            required: 'Truck Ref is required.'
                                        }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <label>Truck Ref</label>
                                                <Dropdown id={field.name} value={field.value} key={field.name} style={{marginRight:5, marginLeft:10}} optionValue="value" optionLabel="label" onChange={(e) => field.onChange(e.target.value)} options={dropdownTruckList} placeholder="Select" className={classNames({ 'p-invalid': fieldState.error })} />
                                                {getFormErrorMessage(field.name)}
                                            </>
                                        )}
                                    />
                                </div>
                            </div>
                            <Button label="Submit" loading={loadingBtn2} type='submit' className="w-3 mt-3" ></Button>
                        </form>
                    </TabPanel>
                </TabView>
            </div>
          
        </>

    );
}
