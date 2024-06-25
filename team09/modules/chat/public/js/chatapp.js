/**
 *
 *Access the DOM
 */
const history = document.querySelector('.chatList');
const userList = document.querySelector('#userlist');
let csrf = document.getElementById('csrft').getElementsByTagName('input');
const send = document.getElementById('sendmessage');
const messageContent = document.getElementById('messagevalue');
const header = document.getElementById('chat-header');
let timeout = new Date();
let activeUser = {
  userId: 0,
};
//console.log('value', csrf[0].value);
//console.log('name', csrf[0].name);
//global variable
const local = [];
/**
 * Get all users from database
 * Display the users as list
 * give evry user a data.id attribute to access it later
 * this function will be called directly when the page load
 * @see  'DOMContentLoaded' EventListener
 */
//const getUsers = () => {
function getUsers() {
  let output = '';
  fetch('api/users', {
    method: 'GET',
    headers: {
      [csrf[0].name]: csrf[0].value,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      csrf[0].name = data.csrf.name;
      csrf[0].value = data.csrf.value;
      const temporary = data.array.filter(
        (data) => data.userId != activeUser.userId
      );
      //data.array.forEach((d) => {
      temporary.forEach((d) => {
        // <div class="name" name="${d.profile.userName}">${d.profile.userName}</div> line 49
        userList.innerHTML += `
        <li class="clearfix active">
         <img src="/img/user.png" alt="avatar" />
        <div class="about" data-id="${d.profile.profileId}">
         <div class="name">${d.profile.userName}</div>
   </div>
 </li>
        `;
      });
    })
    //.then(getOwnProfile);
    .then(loadChats);
}
/**
 * Get the profile of the logged in user
 * will be called first
 *  this function will be called directly when the page load
 * @see  'DOMContentLoaded' EventListener
 * after this methode , getUs
 *
 *
 */
function getOwnProfile() {
  fetch('api/user/profile', {
    method: 'GET',
    headers: {
      [csrf[0].name]: csrf[0].value,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      csrf[0].name = data.csrf.name;
      csrf[0].value = data.csrf.value;
      activeUser.userId = data.userId;
    })
    //.then(loadChats);
    .then(getUsers);
}

// clear input
const removeInput = () => {
  messageContent.value = '';
};

//insert chat in UI
const insertMessageinUI = (value) => {
  history.innerHTML += `
    <li class="clearfix">
                    <div class="message-data text-right">
                      <span class="message-data-time">${
                        timeout.getHours() + ':' + timeout.getMinutes()
                      }</span>
                    </div>
                    <div class="message other-message float-right">
                      ${value}
                    </div>
                  </li>
  `;
};
//create a Message and stroe it in the database

/**
 *  sendMessage is a function that sends a message to a specified recipient and update the ui with the message
 * @returns {undefined} it doesn't return anything
 */
const sendMessage = () => {
  // retrieve the message content from the input
  const value = messageContent.value;
  // retrieve the receiver ID
  const receiverId = messageContent.getAttribute('data-id');
  // because of prettier
  const mockdata = 'Accept';
  /**
   * send a POST Request to the specified url
   * a messagee will be created and stored in the correspond it chat
   */
  fetch(`/api/chat/send/${receiverId}`, {
    method: 'POST',
    body: JSON.stringify({
      message: value,
    }),
    //needed headers
    headers: {
      [mockdata]: 'application/json',
      'Content-Type': 'application/json',
      [csrf[0].name]: csrf[0].value,
    },
  })
    .then((response) => {
      //console.log(response);
      return response.json();
    })
    .then((data) => {
      //console.log(data);
      csrf[0].name = data.csrf.name;
      csrf[0].value = data.csrf.value;
    });
  /**
   * add the message to the chat window
   * @see insertMessageinUI body
   */
  insertMessageinUI(value);
  /**
   * after the button is clicked, the input feld will be cleared
   * for next messages
   * @see removeInput body
   */
  removeInput();
};
/**
 * Eventlistner, evry time the user click the send button
 * the sendMessage function will be called
 * @see sendMessage
 */
send.addEventListener('click', sendMessage);

// get all chats of the logged use
async function loadChats() {
  fetch('/api/chat', {
    method: 'GET',
    headers: {
      [csrf[0].name]: csrf[0].value,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      csrf[0].name = data.csrf.name;
      csrf[0].value = data.csrf.value;
      //console.log(data.array);
      //console.log(data.length);
      //for (let i = 0; i <= data.array.length; i++) {
      data.array.forEach((d) => local.push(d));
      // data.array.forEach((d) => local.push(d));
    });
}

/**
 *  getMessages will fetch the messages in the corresponding chat
 * @returns {undefined} it doesn't return anything
 */
const getMessages = (data) => {
  /**
   * fetching a GET request with the corresoinding url
   */
  fetch(`/api/chat/${data.chatId}`, {
    method: 'GET',
    headers: {
      [csrf[0].name]: csrf[0].value,
    },
  })
    .then((response) => response.json())
    //csrf exchange with the backend
    .then((data) => {
      csrf[0].name = data.csrf.name;
      csrf[0].value = data.csrf.value;
      //loop in every message
      data.array.forEach((d) => {
        //if the creator of the message is the actual logged user
        // display the message on the right
        if (d.author === activeUser.userId) {
          history.innerHTML += `
    <li class="clearfix">
                    <div class="message-data text-right">
                      <span class="message-data-time">${d.sentOnAt}</span>
                    </div>
                    <div class="message other-message float-right">
                     ${d.data}
                    </div>
                  </li>
                  `;
          //display the message on the left
        } else {
          history.innerHTML += `
            <li class="clearfix">
                    <div class="message-data">
                      <span class="message-data-time">${d.sentOnAt}</span>
                    </div>
                    <div class="message my-message">
                      ${d.data}
                    </div>
                  </li>`;
        }
      });
    });
};

//document.addEventListener('DOMContentLoaded', loadChats);
//document.querySelector('#chats').addEventListener('click', loadData);

/**
 * every list item has a id and can be clickable
 * after clicking on a user , the old messages should be loaded
 * and this specific user will be set as receiver
 *
 */
userList.addEventListener('click', (e) => {
  if (e.target.parentElement.classList.contains('about')) {
    // getting the id attribute
    const id = e.target.parentElement.dataset.id;
    local.forEach((d) => {
      //console.log('inside the event', d);
      if (d.participant2.userId == e.target.parentElement.dataset.id) {
        history.innerHTML = '';
        getMessages(d);
        /* setInterval(() => {
          history.innerHTML = '';
          getMessages(d);
        }, 8000);*/
        //getMessages(d);
        header.innerHTML = `<div class="col-lg-6">
                    
                    <div class="chat-about">
                      <h6 class="m-b-0">${d.participant2.profile.userName}</h6>
                    </div>
                  </div>`;
       // console.log('after filtering the id is', d.participant2.userId);
      }
    });
    messageContent.setAttribute('data-id', id);
    //console.log(messageContent.getAttribute('data-id'));
  }
  e.preventDefault();
});
/**
 * call getOwnProfile when the DOMis loaded
 */
document.addEventListener('DOMContentLoaded', getOwnProfile);
