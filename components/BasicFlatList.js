import React, { Component } from 'react';
import { AppRegistry, FlatList, StyleSheet, Text, View, Image, Alert, Platform, TouchableHighlight, RefreshControl} from 'react-native';
import Swipeout from 'react-native-swipeout';

import EditModal from './EditModal';
import AddModal from './AddModal';

import {deleteTaskLists, getTasksFromServer, updateTaskLists} from "../networking/Server";
import {App, AppContainer} from "../App";

import { NativeModules } from 'react-native'
const {ToastModule} = NativeModules;

class FlatListItem extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeRowKey: null,
            numberOfRefresh: 0,
            item: {}
        };
    }

    // Will change the state of the flat list item after it's been edited
    refreshFlatListItem = (changedItem) => {
        this.setState({item: changedItem});
    };

    render() {
        const swipeSettings = {
            autoClose: true,
            onClose: (secId, rowId, direction) => {
                if (this.state.activeRowKey != null) {
                    this.setState({ activeRowKey: null });
                }
            },
            onOpen: (secId, rowId, direction) => {
                this.setState({ activeRowKey: this.props.item.key });
            },
            right: [
                {
                    onPress: () => {
                        // Here need to change the state and re-render the component
                        let selectedItem = this.state.item.name ? this.state.item : this.props.item;
                        this.props.parentFlatList.refs.editModal.showEditModal(selectedItem, this);
                    },
                    text: 'Edit', type: 'primary'
                },
                {
                    onPress: () => {
                        const deletingRow = this.state.activeRowKey;
                        Alert.alert(
                            'Alert',
                            'Are you sure you want to delete ?',
                            [
                                { text: 'No', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
                                {
                                    text: 'Yes', onPress: () => {
                                        deleteTaskLists(this.props.item._id)
                                            .then(() => {
                                            this.props.parentFlatList.refreshFlatList(deletingRow);
                                            ToastModule.showText(`To-Do List Deleted!`, ToastModule.LENGTH_SHORT)
                                        }).catch((error) => {
                                            console.log(`error = ${error}`);
                                            alert("Failed to remove task from the API.");
                                        });

                                    }
                                },
                            ],
                            { cancelable: true }
                        );
                    },
                    text: 'Delete', type: 'delete'
                }
            ],
            rowId: this.props.index,
            sectionId: 1
        };

        return (
            <Swipeout {...swipeSettings}>
                <View style={{
                    flex: 1,
                    flexDirection:'column',
                }}>
                    <View style={{
                        flex: 1,
                        flexDirection:'row',
                        backgroundColor: '#2f4f4f'
                    }}>
                        <View style={{
                            flex: 1,
                            flexDirection:'column',
                        }}>
                            {/* Defining data to be displayed inside the flat list */}
                            <Text style={styles.flatListItem}>List Name:{'\n'}{this.state.item.name ? this.state.item.name : this.props.item.name}</Text>
                            <Text style={styles.flatListItem}>List Description:{'\n'}{this.state.item.description ? this.state.item.description : this.props.item.description}</Text>
                            <Text style={styles.flatListItem}>Tasks:{'\n'}{this.state.item.tasks ? this.state.item.tasks : this.props.item.tasks.join('\n')}</Text>
                            <Text style={styles.flatListItem}>Created On:{'\n'}{this.state.item.listCreatedOn ? this.state.item.listCreatedOn : this.props.item.listCreatedOn}</Text>
                        </View>

                    </View>
                    <View style={{
                        height: 1,
                        backgroundColor:'white'
                    }}>

                    </View>
                </View>
            </Swipeout>
        );
    }
}

const styles = StyleSheet.create({
    flatListItem: {
        color: '#f0fff0',
        padding: 5,
        fontSize: 16,
    },
    todoSign: {
        fontSize: 26,
        fontStyle: 'italic',
        color: 'teal',
        textAlign: 'center',
        textShadowColor: '#708090',
        textShadowRadius: 4,
        padding: 10
    }
});

export default class BasicFlatList extends Component {
    constructor(props) {
        super(props);
        this.state = ({
            deletedRowKey: null,
            refreshing: false,
            tasksFromServer: []
        });
        // bind "this" to be a FlatList object
        this._onPressAdd = this._onPressAdd.bind(this);
    }

    // Re-rending the user interface is done here
    componentDidMount() {
        this.refreshDataFromServer();
    }

    // This function is using a Promise
    refreshDataFromServer = () => {
        this.setState({ refreshing: true });
        getTasksFromServer().then((tasks) => {
            this.setState({ tasksFromServer: tasks });
            this.setState({ refreshing: false });
        }).catch((error) => {
            this.setState({ tasksFromServer: [] });
            this.setState({ refreshing: false });
        });
    };
    onRefresh = () => {
        this.refreshDataFromServer();
    };

    refreshFlatList = (activeKey) => {
        this.setState((prevState) => {
            return {
                deletedRowKey: activeKey
            }
        });
        this.refs.flatList.scrollToEnd();
    };

    _onPressAdd () {
        // alert('Task Added')
        this.refs.addModal.showAddModal();
    }

    render() {
        return (
            <View style={{flex: 1, marginTop: Platform.OS === 'android' ? 0 : 34}}>
                <View style={{
                    backgroundColor: '#ffebcd',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: 60
                }}>
                    <Text style={styles.todoSign}>To-Do List Manager</Text>

                    <TouchableHighlight
                        style={{marginRight: 10}}
                        underlayColor = '#ffebcd'
                        onPress={this._onPressAdd}
                    >

                        <Image
                            style={{width: 45, height: 45}}
                            source={require('../icons/addIcon.png')}
                        />
                    </TouchableHighlight>
                </View>

                <FlatList
                    ref={"flatList"}
                    data={this.state.tasksFromServer}
                    renderItem={({item, index})=>{
                        return (
                            <FlatListItem item={item} index={index} parentFlatList={this}>

                            </FlatListItem>);
                    }}
                    // This will make a Task List name as a key
                    keyExtractor={(item, index) => item._id} // item.name
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this.onRefresh}
                        />
                    }
                >

                </FlatList>

                <AddModal ref={'addModal'} parentFlatList={this} >

                </AddModal>

                <EditModal ref={'editModal'} parentFlatList={this}>

                </EditModal>
            </View>
        )
    }
}





