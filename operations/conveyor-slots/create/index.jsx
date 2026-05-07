
import React, { useState, useRef, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConveyorLanesService } from '../../../../service/operations/ConveyorLanesService';
import { useDispatch } from 'react-redux';
import { matchPath, useLocation, useNavigate, useParams } from 'react-router-dom';
import { addData } from '../../../../store/formMessage.slice';
import { ConveyorSlotsService } from '../../../../service/operations/ConveyorSlotsService';
import { Dropdown } from 'primereact/dropdown';
export default function AddConveyorSlots() {
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);
    const [slotDetail, setSlotDetail] = useState(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const params = useParams();
    const routePath = useLocation();
    const matchedPath = matchPath({path:'/conveyor/conveyor-slots/edit',end:false},routePath.pathname);
    const [heading, setHeading] = useState('Add Slot');
    const [ips, setIps] = useState([]);
    const [locations, setLocations] = useState([]);
    const [lanes, setLanes] = useState([]);

    let defaultValues = { 
        title: '',
        lane_id: '',
        mantis_location_id: '',
    };

    const form = useForm({ defaultValues });
    const errors = form.formState.errors;

    useEffect(() => {
        if(matchedPath !== null){
            getDetails();
            setHeading('Edit Slot');
        } 

        ConveyorSlotsService.getFormObj().then(data => {
            setIps(data?.data.ips);
            setLocations(data?.data.locations);
            setLanes(data?.data.lanes);
            
        });
        
    }, []);

    const getDetails = () => {
        ConveyorSlotsService.getSlotDetail(params.id).then((data) => {
            setSlotDetail(data.data);
            form.setValue('title',data.data.title??'');
            form.setValue('ip',data.data.ip??'');
            form.setValue('tag',data.data.ptl_address??'');
            form.setValue('lane_id',data.data.lane??'');
            form.setValue('mantis_location_id',data.data.title??'');
        });
    };


    const onSubmit = (data) => {
        setLoading(true);
        const mantisLocation = form.getValues('mantis_location_id');
        const lane = form.getValues('lane_id');
        
        data = {
            title: mantisLocation.loc_Code,
            lane_id: lane.id,
            lane: lane.title,
            mantis_location_id: mantisLocation.loc_ID,
            ip: form.getValues('ip')?.id,
            tag: form.getValues('tag') || null
        }
        // console.log(data);return false
        if(matchedPath === null){
            ConveyorSlotsService.addSlot( (data) ).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    form.reset();
                    dispatch(addData({severity: 'success', detail: data.message, summary: 'Slot Created'}));
                    navigate("/conveyor/conveyor-slots")
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error in Slot creation', detail: data.message});
                }
            });
        } else{
            ConveyorSlotsService.updateSlot(params.id, data).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    form.reset();
                    dispatch(addData({severity: 'success', detail: data.message, summary: 'Slot Updated'}));
                    navigate("/conveyor/conveyor-slots")
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error in Slot', detail: data.message});
                }
            });
        }
       
    };

    const getFormErrorMessage = (name) => {
        return errors[name] ? <small className="p-error">{errors[name].message}</small> : null;
    };   

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{heading}</h3>
            </div>
            <h1></h1>
            <Toast ref={toast} />

            <form onSubmit={form.handleSubmit(onSubmit)} className="">
                <div className="card">
                    <h1></h1>
                    <div className="p-fluid formgrid grid">
                        <div className="field col-12 md:col-5">
                            <Controller
                                name="mantis_location_id"
                                control={form.control}
                                rules={{ 
                                    required: 'Mantis Location is required.'
                                }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <label>Mantis Location</label>
                                        <Dropdown value={field.value} 
                                         onChange={(e) => {
                                            field.onChange(e.target.value)
                                        }} 
                                        options={locations} optionLabel="loc_Code" 
                                        editable
                                         placeholder="Select Locations" 
                                         className="" />
                                        {getFormErrorMessage(field.name)}
                                    </>
                                )}
                            />
                        </div>
                       
                        <div className="field col-12 md:col-5">
                            <Controller
                                name="lane_id"
                                control={form.control}
                                rules={{ 
                                    required: 'Conveyor Name is required.'
                                }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <label>Lane </label>
                                        <Dropdown value={field.value} 
                                         onChange={(e) => {
                                            field.onChange(e.target.value)
                                        }} 
                                        options={lanes} optionLabel="title" 
                                        editable
                                         placeholder="Select Lanes" 
                                         className="" />
                                        {getFormErrorMessage(field.name)}
                                    </>
                                )}
                            />
                        </div>

                        
                        <div className="field col-12 md:col-5">
                            <Controller
                                name="tag"
                                control={form.control}
                               
                                render={({ field, fieldState }) => (
                                    <>
                                        <label>Tag</label>
                                        <InputText id={field.name} 
                                            value={field.value} 
                                            type="text" 
                                            className={classNames({ 'p-invalid': fieldState.error })} 
                                            onChange={(e) => {
                                                field.onChange(e.target.value)
                                            }} 
                                        />
                                        
                                    </>
                                )}
                            />
                        </div>
                        <div className="field col-12 md:col-5">
                            <Controller
                                name="ip"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <>
                                        <label>IP</label>
                                        
                                        <Dropdown value={field.value} 
                                         onChange={(e) => {
                                            field.onChange(e.target.value)
                                        }} 
                                        options={ips} optionLabel="ip" 
                                        editable
                                         placeholder="Select IP" 
                                         className="" />

                                        {getFormErrorMessage(field.name)}
                                    </>
                                )}
                            />
                        </div>
                               
                    </div>
                    <Button label="Submit" loading={loading} type='submit' className="w-3 mt-3" ></Button>
                </div>
            </form>
        </>
    );
}
