import React from 'react';
import { View, ScrollView } from 'react-native';
import DataTableRow from 'react-native-datatable-component/src/DataTableRow';
import DataTableFooter from 'react-native-datatable-component/src/DataTableFooter';
import DataTableHeader from 'react-native-datatable-component/src/DataTableHeader';
import Line from 'react-native-datatable-component/src/Line';
import sortData from 'react-native-datatable-component/functions/sort';
import showCurrentProgress from 'react-native-datatable-component/functions/showCurrentProgress';

export const COL_TYPES = {
    INT: 'INT',
    STRING: 'STRING',
    CHECK_BOX: 'CHECK_BOX'
}

const TOTAL_WIDTH = 100; //'100%'

interface PropTypes {
    data?: object[];
    colNames?: string[];
    colSettings?: object[];
    noOfPages?: number;
    onRowSelect?: (anyVariable) => object;
    backgroundColor?: string;
    doSort?: boolean;
}

class DataTable extends React.Component<PropTypes> {
    state = {
        dataPropSnap: null,
        data: [], //[{...}, {...}, ....]
        displayData: [], //currentlyDisplayData
        colNames: [],//['ad', 'asd', ...]
        defaultEachColumnWidth: '50%',
        // noOfCols: 0, //default 2, set 0 because of fast rendering at start
        widthOfContainer: 0,
        isSortedAssending: { recentlySortedCol: null }, //ColName: true||false
        startDataArray: [],//[{id: startData}]
        endDataArray: [], //[{id, endData}]
        noOfPages: 3, //default
        activeDisplayDataId: 0,
        mapColNameToType: {}
    }


    handleColPress = name => {
        const newData = [...this.state.displayData];

        const { recentlySortedCol } = this.state.isSortedAssending

        if (recentlySortedCol == name) {
            // Here we want to sort based on previus col State
            const data = sortData(newData, this.state.isSortedAssending[name], name)
            this.setState(state => ({
                displayData: newData,
                isSortedAssending: {
                    ...state.isSortedAssending,
                    [name]: data.setIsSortedAsc,
                    recentlySortedCol: name
                }
            }))
        } else {
            // Here we want to sort always in ascending Order
            const data = sortData(newData, this.state.isSortedAssending[name], name, true)
            this.setState(state => ({
                displayData: newData,
                isSortedAssending: {
                    ...state.isSortedAssending,
                    [name]: data.setIsSortedAsc,
                    recentlySortedCol: name
                }
            }))
        }
    }

    handleOnRowSelect = (isChecked, id, colName) => {
        const data = this.state.data.map(row => {
            if (row.id != id) return row;
            if ('onRowSelect' in this.props) this.props?.onRowSelect({ ...row, [colName]: isChecked }) // Sending props
            return { ...row, [colName]: isChecked }
        })

        const displayData = this.state.displayData.map(row => {
            if (row.id != id) return row;
            return { ...row, [colName]: isChecked }
        })

        this.setState({
            data,
            displayData
        })
    }

    handleNextPreviousPagePress = (type) => {//next | back
        if (type == 'next') {
            // this.state.activeDisplayDataId
            const activeDisplayId = this.state.activeDisplayDataId;
            const endObj = this.state.endDataArray.find(obj => obj.id == activeDisplayId + 1);
            const startObj = this.state.startDataArray.find(obj => obj.id == activeDisplayId + 1);

            this.setState({
                displayData: this.state.data.slice(startObj?.startData - 1, endObj?.endData),
                activeDisplayDataId: activeDisplayId + 1
            });

        } else if (type == 'back') {
            const activeDisplayId = this.state.activeDisplayDataId;
            const endObj = this.state.endDataArray.find(obj => obj.id == activeDisplayId - 1);
            const startObj = this.state.startDataArray.find(obj => obj.id == activeDisplayId - 1);

            this.setState({
                displayData: this.state.data.slice(startObj?.startData - 1, endObj?.endData),
                activeDisplayDataId: activeDisplayId - 1
            });
        }
    }

    static getDerivedStateFromProps(props, currentState) {
        //this called on every setState() & on mount & on prop changes
        if (JSON.stringify(props.data) === JSON.stringify(currentState.dataPropSnap)) return null;
        //Here below code means that data prop is changed
        let data = props?.data
        let colNames = props?.colNames;

        if (typeof (data) != 'object') {
            data = [];
        }
        if (typeof (colNames) != 'object') {
            colNames = ['No Columns'];
        }

        const mapColNameToType = {}
        props.colSettings?.forEach(setting => {
            if (!colNames.includes(setting.name)) throw new Error('No Column exists which mentioned in provided colSettings prop Name!')
            mapColNameToType[setting.name] = setting.type;
        })
        let start = [];
        let end = []
        if (data.length != 0) {
            const progress = showCurrentProgress(props?.noOfPages, data?.length) //[{id, endData}]
            if (progress) {
                start = progress.start;
                end = progress.end;
            }
        }

        const noOfCols = colNames.length;
        const isSortedAssending = {};
        colNames.forEach(name => {
            isSortedAssending[name] = false;
        })

        const modifiedData = data.map((row, index) => {
            if (!row.id) return { ...row, id: index }
            return row;
        })
        return {
            dataPropSnap: props?.data,
            data: modifiedData,
            displayData: modifiedData.slice(0, end[0]?.endData),
            colNames: [...colNames],
            defaultEachColumnWidth: TOTAL_WIDTH / noOfCols + '%',
            isSortedAssending: { ...currentState.isSortedAssending, ...isSortedAssending },
            activeDisplayDataId: 0, //by default it's zero
            startDataArray: start,
            endDataArray: end,
            mapColNameToType
        };
    }

    render() {

        return (
            <View style={{ backgroundColor: this.props.backgroundColor ? this.props.backgroundColor : '#e4edec' }}
                onLayout={e => {
                    this.setState({ widthOfContainer: e.nativeEvent.layout.width })
                }}>

                <DataTableHeader
                    colNames={this.state.colNames}
                    mapColNameToType={this.state.mapColNameToType}
                    defaultEachColumnWidth={this.state.defaultEachColumnWidth}
                    handleColPress={this.handleColPress}
                    doSort={this.props?.doSort}
                />

                <Line width={this.state.widthOfContainer} header />
                <ScrollView>
                    {
                        this.state.displayData.map((item, index) => (
                            <DataTableRow
                                handleOnRowSelect={this.handleOnRowSelect}
                                widthOfLine={this.state.widthOfContainer}
                                key={index}
                                index={index}
                                data={item}
                                mapColNameToType={this.state.mapColNameToType}
                                colNames={this.state.colNames}
                                style={{ defaultEachColumnWidth: this.state.defaultEachColumnWidth }}
                            />
                        ))
                    }
                </ScrollView>
                <DataTableFooter
                    start={this.state.startDataArray}
                    end={this.state.endDataArray}
                    activeDataId={this.state.activeDisplayDataId}
                    dataLength={this.state.data.length}
                    handleNextPreviousPagePress={this.handleNextPreviousPagePress}
                />

            </View>
        );
    }
}

export default DataTable;
