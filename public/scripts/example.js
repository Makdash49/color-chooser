var Comment = React.createClass({
  rawMarkup: function() {
    var rawMarkup = marked(this.props.children.toString(), {sanitize: true});
    return { __html: rawMarkup };
  },

  render: function() {
    var input = this.rawMarkup().__html.substring(3).slice(0, -5)
    var answer = myDiv(input)
    return (
      <div className="comment">
        <h4 className="commentAuthor">
          <h3></h3>
          Quantity: {this.props.author}
        </h4>
          <div style={answer}>
            {input}
          </div>
      </div>
    );
  }
});

var CommentBox = React.createClass({
  loadCommentsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  handleCommentSubmit: function(comment) {
    var comments = this.state.data;
    comment.id = Date.now();
    var newComments = comments.concat([comment]);
    this.setState({data: newComments});
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: comment,
      success: function(data) {
        this.setState({data: data});
        svg.selectAll("*").remove()
        renderGraph()
      }.bind(this),
      error: function(xhr, status, err) {
        this.setState({data: comments});
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadCommentsFromServer();
    setInterval(this.loadCommentsFromServer, this.props.pollInterval);
  },
  render: function() {
    return (
      <div className="commentBox">
        <h1>Count & Hue</h1>
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
        <CommentList data={this.state.data} />
        <h5></h5>
      </div>
    );
  }
});

var CommentList = React.createClass({
  render: function() {
    console.log("last prop:", this.props.data[this.props.data.length - 1]);
    var commentNodes = this.props.data.map(function(comment) {
      return (
        <Comment author={comment.author} key={comment.id}>
            {comment.text}
        </Comment>
      );
    });
    console.log("commentNodes:", commentNodes)
    return (
      <div className="commentList">
        {commentNodes[commentNodes.length - 1]}
      </div>
    );
  }
});

var CommentForm = React.createClass({
  getInitialState: function() {
    return {author: '', text: ''};
  },
  handleAuthorChange: function(e) {
    this.setState({author: e.target.value});
  },
  handleTextChange: function(e) {
    this.setState({text: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var author = this.state.author.trim();
    var text = this.state.text.trim();
    if (!text || !author) {
      return;
    }
    this.props.onCommentSubmit({author: author, text: text});
    this.setState({author: '', text: ''});
  },
  render: function() {
    return (
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <input
          type="text"
          placeholder="How many?  1-100"
          value={this.state.author}
          onChange={this.handleAuthorChange}
        />
        <input
          type="text"
          placeholder="What color?"
          value={this.state.text}
          onChange={this.handleTextChange}
        />
        <input type="submit" value="Post" />
      </form>
    );
  }
});

var myDiv = function (color){
  return (
    {backgroundColor: color,
      width: 50,
      padding: 50,
      border: '5px solid black'}
  )
}

ReactDOM.render(
  <CommentBox url="/api/comments" pollInterval={2000} />,
  document.getElementById('content')
);


var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 760 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(10);

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var renderGraph = function() { d3.json("comments.json", function(error, data) {
  if (error) throw error;

  x.domain(data.map(function(d) { return d.text; }));
  y.domain([0, d3.max(data, function(d) { return 100; })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Quantity");

  svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.text); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.author); })
      .attr("height", function(d) { return height - y(d.author); })
      .attr("fill", function(d) {return d.text;});
})}

function type(d) {
  d.author = +d.author;
  return d;
};


$(document ).ready(function() {
    renderGraph();
});
