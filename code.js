function doPost(e) {
  // define spreadsheet to use
  var ss_id = "146dSs22DDZyQRotkRS0lniZF2WOyvngL2Ly0xnMFfas"
  
  // add logging
  Logger = BetterLog.useSpreadsheet(ss_id)
  
  // get the parameters
  var params = e.parameter

  // run if command sends request
  if (params.call == "command") {

    // create payload
    //Logger.log(JSON.stringify(params))
    var trigger_id = params.trigger_id
    var modal_payload = {
      "trigger_id": trigger_id,

      // create view itself
      "view": {
        "type": "modal",
        "callback_id": "shopping_modal",
        "title": {
          "type": "plain_text",
          "text": "Shopping List"
        },
        "submit": {
          "type": "plain_text",
          "text": "Submit"
        },
        "close": {
          "type": "plain_text",
          "text": "Cancel"
        },
        "blocks": [

          // build category block
          {
            "type": "input",
            "block_id": "category",
            "label": {
              "type": "plain_text",
              "text": "What to buy?"
            },
            "optional": false,
            "element": {
              "action_id": "single_select",
              "type": "static_select",
              "placeholder": {  
                "type": "plain_text",
                "text": "Choose a category"
              },
              "options": [
                {
                  "value": "food",
                  "text": {
                    "type": "plain_text",
                    "text": "Food"
                  }
                },
                {
                  "value": "stationary",
                  "text": {
                    "type": "plain_text",
                    "text": "Stationary"
                  }
                },
                {
                  "value": "other",
                  "text": {
                    "type": "plain_text",
                    "text": "Other"
                  }
                }
              ]
            }
          },

          // build items block
          {
            "type": "input",
            "block_id": "items",
            "label": {
              "type": "plain_text",
              "text": "What items?"
            },
            "optional": false,
            "element": {
              "action_id": "comment_box",
              "type": "plain_text_input",
              "multiline": true,
              "placeholder": {
                "type": "plain_text",
                "text": "List what you need"
              }
            }
          },

          // build date block
          {
            "type": "input",
            "block_id": "date",
            "label": {
              "type": "plain_text",
              "text": "By when do you need it?"
            },
            "optional": true,
            "element": {
              "action_id": "date_picker",
              "type": "datepicker",
            }
          },
          
          // build comments block
          {
            "type": "input",
            "block_id": "comment",
            "label": {
              "type": "plain_text",
              "text": "Any comments?"
            },
            "optional": true,
            "element": {
              "action_id": "comment_box",
              "type": "plain_text_input",
              "multiline": true,
              "placeholder": {
                "type": "plain_text",
                "text": "Provide extra details, if necessary"
              }
            }
          }
        ]
      }
    }

    // initiate modal in Slack
    sendToSlack("https://slack.com/api/views.open", modal_payload)
  }

  // run when interaction sends request
  else if (params.call == "interaction") {
    var payload = JSON.parse(params.payload)
    //Logger.log(JSON.stringify(payload))

    // run when sent modal and the right modal
    if (payload.type == "view_submission" && payload.view.callback_id == "shopping_modal") {

      // send results to #shopping app channel
      var user_id = payload.user.id
      var user_name = getUserName(user_id)
      var date = new Date()
      var date_string = Utilities.formatDate(date, "GMT", "yyyy-MM-dd")
      var date_unix = Math.floor((date.getTime()/1000)).toString()
      var view_vls = payload.view.state.values
      
      var category = view_vls.category.single_select.selected_option.text.text
      var items = view_vls.items.comment_box.value
      
      if (typeof view_vls.date.date_picker.selected_date != "undefined") {var deadline = view_vls.date.date_picker.selected_date}
      else {var deadline = "NA"}
 
      if (typeof view_vls.comment.comment_box.value != "undefined") {var comment = view_vls.comment.comment_box.value}
      else {var comment = "NA"}
      
      var ticket_info = {
        "user_id": user_id,
        "user_name": user_name,
        "date": date_string,
        "category": category,
        "items": items,
        "deadline": deadline,
        "comment": comment
      }
      var ticket_info_str = JSON.stringify(ticket_info)
      
      var result = {
        "text": "A new request!",
        "blocks": [
          {
            "type": "section",
            "block_id": "text",
            "text": {
              "type": "mrkdwn",
              "text": "You have a *new request*! :eyes:"
            }
          }
        ],
        "attachments": [
          {
            "color": "#2469EC",
            "fallback": "Shopping request",
            "blocks": [
              {
                "type": "section",
                "block_id": "category_items",
                "fields": [
                  {
                    "type": "mrkdwn",
                    "text": "*Category*\n" + category
                  },
                  {
                    "type": "mrkdwn",
                    "text": "*Items*\n" + items
                  }
                ]
              },
              {
                "type": "section",
                "block_id": "deadline_comment",
                "fields": [
                  {
                    "type": "mrkdwn",
                    "text": "*Deadline*\n" + deadline
                  },
                  {
                    "type": "mrkdwn",
                    "text": "*Comment*\n" + comment
                  }
                ]
              },
              {
                "type": "context",
                "block_id": "context",
                "elements": [
                  {
                    "type": "mrkdwn",
                    "text": "Submitted by " + user_name + " | <!date^" + date_unix + "^{date_short_pretty} at {time}|" + date + ">"
                  }
                ]
              }
            ]
          },
          {
            "fallback": "Action buttons",
            "blocks": [
              {
                "type": "actions",
                "block_id": "action_buttons",
                "elements": [
                  {
                    "type": "button",
                    "action_id": "approve_button",
                    "value": ticket_info_str,
                    "style": "primary",
                    "text": {
                      "type": "plain_text",
                      "text": "Approve"
                    }
                  },
                  {
                    "type": "button",
                    "action_id": "decline_button",
                    "value": ticket_info_str,
                    "style": "danger",
                    "text": {
                      "type": "plain_text",
                      "text": "Decline"
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
  
      // send ticket to #shopping
      sendToSlack("https://hooks.slack.com/services/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", result)
      
      // send notification to user
      var msg = {
        "channel": user_id,
        "text": "Your shopping request was submitted.",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Your shopping request was *submitted* to <#C0133U53W9J> channel. :pencil:"
            }
          }
        ]
      }
      sendToSlack("https://slack.com/api/chat.postMessage", msg)
    }
    
    // run when interaction with buttons happened
    else if (payload.type == "block_actions") {
      var response_user_id = payload.user.id
      var response_user_name = getUserName(response_user_id)
      var channel_id = payload.channel.id
      var response_url = payload.response_url
      var response_time = new Date()
      var response_time_unix = Math.floor((response_time.getTime()/1000)).toString()
      var ticket_blocks = payload.message.attachments[0].blocks
      var ticket_ts = payload.message.ts
      var action_id = payload.actions[0].action_id
      
      // get ticket values
      var ticket_info = JSON.parse(payload.actions[0].value)
      var user_id = ticket_info.user_id
      var user_name = getUserName(user_id)
      var date = ticket_info.date
      var category = ticket_info.category
      var items = ticket_info.items
      var deadline = ticket_info.deadline
      var comment = ticket_info.comment
      
      // get ticket permalink
      var ticket_origin = {
        "channel": channel_id,
        "message_ts": ticket_ts
      }
      var ticket_permalink = getMsgUrl(ticket_origin)
      
      // run when approved
      if (action_id == "approve_button") {
        
        // send info to sheet
        var ticket_data = [user_name, date, category, items, deadline, comment] 
        sendToSheet(ss_id, ticket_data)
        
        // prepare result and message
        var result = {
          "channel": user_id,
          "blocks": [
            {
              "type": "section",
              "block_id": "text",
              "text": {
                "type": "mrkdwn",
                "text": "This request was *approved*. :white_check_mark:"
              }
            }
          ],
          "attachments": [
            {
              "color": "#36A54F",
              "blocks": ticket_blocks
            },
            {
              "blocks": [
                {
                  "type": "context",
                  "block_id": "status",
                  "elements": [
                    {
                      "type": "mrkdwn",
                      "text": "Approved by " + response_user_name + " | <!date^" + response_time_unix + "^{date_short_pretty} at {time}|" + response_time + ">"
                    }
                  ]
                }
              ]         
            }
          ]
        }
        var msg = {
          "channel": user_id,
          "text": "Your shopping request was approved.",
          "unfurl_links": true,
          "blocks": [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "<" + ticket_permalink + "|Your shopping request> was *approved*. :white_check_mark:"
              }
            }
          ]
        }
      }
      
      // run when declined
      else if (action_id == "decline_button") {
        
        // prepare result and message
        var result = {
          "channel": response_user_id,
          "blocks": [
            {
              "type": "section",
              "block_id": "text",
              "text": {
                "type": "mrkdwn",
                "text": "This request was *declined*. :x:"
              }
            }
          ],
          "attachments": [
            {
              "color": "#E83436",
              "blocks": ticket_blocks
            },
            {
              "blocks": [
                {
                  "type": "context",
                  "block_id": "status",
                  "elements": [
                    {
                      "type": "mrkdwn",
                      "text": "Declined by " + response_user_name + " | <!date^" + response_time_unix + "^{date_short_pretty} at {time}|" + response_time + ">"
                    }
                  ]
                }
              ]         
            }
          ]
        }
        var msg = {
          "channel": response_user_id,
          "text": "Your shopping request was declined.",
          "unfurl_links": true,
          "blocks": [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "<" + ticket_permalink + "|Your shopping request> was *declined*. :x:"
              }
            }
          ]
        }
      }
      
      // update the message with appropriate result
      sendToSlack(response_url, result)
      
      // send notification to the user
      sendToSlack("https://slack.com/api/chat.postMessage", msg)
    }
  }
  // respond with basic acknowledgment response
  return ContentService.createTextOutput("")
}
  
// function that sends data to Slack
function sendToSlack(url, payload) {
   var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "headers": {"Authorization": "Bearer xoxb-461064433984-1093080527460-Gbumi9IJEXtka5Um8MZpNq9t"}
  }
  return UrlFetchApp.fetch(url, options)
}

// function that gets user name from Slack
function getUserName(user_id) {
  var options = {
    "method": "get",
    "contentType": "application/x-www-form-urlencoded",
    "payload": {
      "user": user_id
    },
    "headers": {"Authorization": "Bearer xoxb-461064433984-1093080527460-Gbumi9IJEXtka5Um8MZpNq9t"}
  }
  var resp = UrlFetchApp.fetch("https://slack.com/api/users.info", options)
  return JSON.parse(resp).user.profile.display_name_normalized
}

// function that gets URL of message from Slack
function getMsgUrl(payload) {
  var options = {
    "method": "get",
    "contentType": "application/x-www-form-urlencoded",
    "payload": payload,
    "headers": {"Authorization": "Bearer xoxb-461064433984-1093080527460-Gbumi9IJEXtka5Um8MZpNq9t"}
  }
  var resp = UrlFetchApp.fetch("https://slack.com/api/chat.getPermalink", options)
  return JSON.parse(resp).permalink  
}

// function that writes data to Sheets
function sendToSheet(spreadsheet_id, data) {
  var ss = SpreadsheetApp.openById(spreadsheet_id)
  var sheet = ss.getSheetByName("Requests")
  var last_row = sheet.getLastRow();
  return sheet.getRange(last_row + 1, 1, 1, data.length).setValues([data])
}