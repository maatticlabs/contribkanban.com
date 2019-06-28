import React, { Component } from 'react';
import superagent from 'superagent';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { baseUrl } from "../../utils";

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};
const getItemStyle = (isDragging, draggableStyle) => ({
  userSelect: "none",
  backgroundColor: isDragging ? "#209cee" : "white",
  paddingLeft: '2em',
  paddingTop: '0.5rem',
  paddingBottom: '0.5rem',
  paddingRight: '0.5rem',
  backgroundImage: `url('/core/misc/icons/bebebe/move.svg')`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: '0.5rem center',
  ...draggableStyle
});

class NodeBoardForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      processing: false,
      error: false,
      board: drupalSettings.form.board,
      uid: drupalSettings.form.uid,
      csrfToken: drupalSettings.form.csrfToken,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onCollaborationChange = this.onCollaborationChange.bind(this);
    this.addNewIssue = this.addNewIssue.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
  }
  handleSubmit(event) {
    event.preventDefault();
    this.setState({
      processing: true,
    }, () => {
      superagent.get(`${baseUrl}/session/token`)
      .then(res => {
        const csrfToken = res.text
        let request;
        const payload = this.state.board;
        if (!this.isEdit()) {
          request = superagent.post(`${baseUrl}entity/node_board`)
          delete payload['board_id'];
        } else {
          request = superagent.patch(`${baseUrl}node-board/${this.state.board.uuid}`)
        }
        request
          .set('X-CSRF-Token', csrfToken)
          .send(payload)
          .end((error, res) => {
            if (res.statusCode === 200) {
              window.location.href = `${baseUrl}node-board/${this.state.board.uuid}`
            }
            else if (res.statusCode === 201) {
              const body = JSON.parse(res.text);
              window.location.href = `${baseUrl}node-board/${body.uuid}`
            }
            else {
              alert(res.text);
            }
          });
      })
    });
  }
  getTitle() {
    return this.isEdit() ? 'Edit board' : 'Add new board';
  }
  isEdit() { return this.state.board.hasOwnProperty('board_id') && this.state.board.board_id !== null }
  canEdit() { return parseInt(this.state.uid) === parseInt(this.state.board.uid) }
  onCollaborationChange(event) {
    this.setState({
      board: {
        ...this.state.board,
        collaboration: event.target.value
      }
    });
  }
  addNewIssue() {
    this.setState({
      board: {
        ...this.state.board,
        nids: [...this.state.board.nids, '']
      },
    });
  }
  onDragEnd(result) {
    if (!result.destination) {
      return;
    }

    const items = reorder(
      this.state.board.nids,
      result.source.index,
      result.destination.index
    );

    this.setState({
      board: {
        ...this.state.board,
        nids: items
      }
    });
  }
  render() {
    return(
      <div className="columns">
        <div className="column is-8 is-offset-2">
          <form onSubmit={this.handleSubmit}>
            <div className="">
              <h1 className="title">{this.getTitle()}</h1>
              <div className="columns" style={{marginBottom: '1em'}}>
                <div className="column is-4">
                  <div className="box">
                    <div className="field">
                      <label for="board-title" className="label sr-only">Board name</label>
                      <div className="control">
                        <input
                          className="input"
                          id="board-title"
                          aria-label="Board name"
                          type="text"
                          placeholder={`Board name`}
                          required={true}
                          disabled={!this.canEdit() && this.isEdit()}
                          readOnly={!this.canEdit() && this.isEdit()}
                          value={this.state.board.title}
                          onChange={(e) => this.setState({
                            board: {
                              ...this.state.board,
                              title: e.target.value
                            }
                          })}
                        />
                      </div>
                    </div>
                    <div className={`field`}>
                      <label className={`has-text-weight-semibold`}>Collaboration</label>
                      <div className={`control`}>
                        <label className="radio">
                          <input
                            type="radio"
                            value={`private`}
                            checked={this.state.board.collaboration === 'private'}
                            onChange={this.onCollaborationChange}
                            disabled={!this.canEdit() && this.isEdit()}
                            readOnly={!this.canEdit() && this.isEdit()}
                            style={{marginRight: '5'}}
                          />
                          <span className={`is-small`}>Private: only accessible to you, when logged in</span>
                        </label>
                      </div>
                      <div className={`control`}>
                        <label className="radio">
                          <input
                            type="radio"
                            value={`shared`}
                            checked={this.state.board.collaboration === 'shared'}
                            onChange={this.onCollaborationChange}
                            disabled={!this.canEdit() && this.isEdit()}
                            readOnly={!this.canEdit() && this.isEdit()}
                            style={{marginRight: '5'}}
                          />
                          <span className={`is-small`}>Shared: only you may edit, but anyone can view via link access</span>
                        </label>
                      </div>
                      <div className={`control`}>
                        <label className="radio">
                          <input
                            type="radio"
                            value={`public`}
                            checked={this.state.board.collaboration === 'public'}
                            onChange={this.onCollaborationChange}
                            disabled={!this.canEdit() && this.isEdit()}
                            readOnly={!this.canEdit() && this.isEdit()}
                            style={{marginRight: '5'}}
                          />
                          <span className={`is-small`}>Public: anyone with the link can view and edit</span>
                        </label>
                      </div>
                    </div>
                    <div className="control">
                      <button
                        className={`is-primary button ${this.state.processing ? ['is-loading'] : []}`}
                        tabIndex={100}
                      >Submit</button>
                    </div>
                  </div>
                </div>
                <div className="column">
                  <div className={`box`}>
                    <div className="field">
                      <DragDropContext onDragEnd={this.onDragEnd}>
                        <Droppable droppableId="droppable">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                            >
                              {this.state.board.nids.map((item, index) => (
                                <Draggable key={item === '' ? `_new${index}` : item} draggableId={item === '' ? `_new${index}` : item} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={getItemStyle(
                                        snapshot.isDragging,
                                        provided.draggableProps.style
                                      )}
                                    >
                                        <div className="control">
                                          <label for={`issue-node-id-${index}`} className="label sr-only">Issue node ID</label>
                                          <input
                                            className="input"
                                            type="text"
                                            id={`issue-node-id-${index}`}
                                            placeholder={`Issue node ID`}
                                            value={item}
                                            required={this.state.board.nids.length === 1}
                                            onChange={(e) => {
                                              const newNid = e.target.value;
                                              this.setState({
                                                board: {
                                                  ...this.state.board,
                                                  nids: this.state.board.nids.map((s, _id) => {
                                                    if (_id !== index) return s;
                                                    return newNid;
                                                  })
                                                },
                                              });
                                            }}
                                          />
                                        </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                      {/*{this.state.board.nids.map((node, id) => (*/}
                      {/*  <div className="control">*/}
                      {/*    <label for={`issue-node-id-${id}`} className="label sr-only">Issue node ID</label>*/}
                      {/*    <input*/}
                      {/*      className="input"*/}
                      {/*      type="text"*/}
                      {/*      id={`issue-node-id-${id}`}*/}
                      {/*      placeholder={`Issue node ID`}*/}
                      {/*      value={node}*/}
                      {/*      style={{*/}
                      {/*        marginBottom: '10px'*/}
                      {/*      }}*/}
                      {/*      required={this.state.board.nids.length === 1}*/}
                      {/*      onChange={(e) => {*/}
                      {/*        const newNid = e.target.value;*/}
                      {/*        this.setState({*/}
                      {/*          board: {*/}
                      {/*            ...this.state.board,*/}
                      {/*            nids: this.state.board.nids.map((s, _id) => {*/}
                      {/*              if (_id !== id) return s;*/}
                      {/*              return newNid;*/}
                      {/*            })*/}
                      {/*          },*/}
                      {/*        });*/}
                      {/*      }}*/}
                      {/*    />*/}
                      {/*  </div>*/}
                      {/*))}*/}
                      <button
                        className="is-info button"
                        type="button"
                        onClick={this.addNewIssue}
                      >Add another issue</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    )
  }
}

export default NodeBoardForm;
