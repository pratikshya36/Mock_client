import React, { Component } from "react";
 import FlipMove from "react-flip-move";

class TodoItems extends Component {
  createTasks(item) {
    return <li key={item.key}><a href="#">{item.text}</a></li>
  }
 
  render() {
    var todoEntries = this.props.entries;
    var listItems = todoEntries.map(this.createTasks);
 
    return (
      <ul className="theList">
       <FlipMove duration={250} easing="ease-out">
          {listItems}
          </FlipMove>

      </ul>
    );
  }
};
 
export default TodoItems;