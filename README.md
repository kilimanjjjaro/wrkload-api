# Wrkload API

wrkload API is a simple, easy-to-use API that is focused on the documentation of the time that a user takes to do a task.
## License

[MIT](https://choosealicense.com/licenses/mit/)


## Tasks API References

<details>
<summary>See details</summary>

### Get all tasks
#### Only for users with administrator role.

```
  GET /api/v1/tasks
```

| HTTP headers | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `Authorization`      | `bearer token` | `true` | Valid JWT token generated at login. |

| Request parameters | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `per_page` | `string` | `false` | The number of results to return per page. |
| `page` | `string` | `false` | Use this to page through the results. |

| Response object | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `_id` | `string` | ID task. |
| `name`      | `string` | Name of task. |
| `author_id`      | `string` | Author ID of task. |
| `project`      | `string` | Task project name. |
| `timing`      | `string` | Time the task was completed. |
| `month`      | `string` | Month the task was completed. |
| `delivered`      | `string` | Date the task was completed. ISO8601 format required. |
| `description`      | `string` | Description of the task. |

<br>

### Get task
#### You can only read own tasks.

```
  GET /api/v1/tasks/${id}
```
| HTTP headers | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `Authorization`      | `bearer token` | `true` | Valid JWT token generated at login. |

| Request parameters | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `id`      | `string` | `true` | ID task. |

<br>

### Create task

```
  POST /api/v1/tasks
```
| HTTP headers | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `Authorization`      | `bearer token` | `true` | Valid JWT token generated at login. |

| Request object | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `name`      | `string` | `true` | Name of task. |
| `project`      | `string` | `true` | Task project name. |
| `timing`      | `string` | `true` | Time the task was completed. |
| `month`      | `string` | `true` | Month the task was completed. |
| `delivered`      | `string` | `false` | Date the task was completed. ISO8601 format required. |
| `description`      | `string` | `false` | Description of the task. |

<br>

### Update task
#### You can only update own tasks, even the admin can't update yours either.

```
  PATCH /api/v1/tasks/${id}
```
| HTTP headers | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `Authorization`      | `bearer token` | `true` | Valid JWT token generated at login. |

| Request parameters | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `id`      | `string` | `true` | ID task. |

| Request object | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `name`      | `string` | `true` | Name of task. |
| `project`      | `string` | `true` | Task project name. |
| `timing`      | `string` | `true` | Time the task was completed. |
| `month`      | `string` | `true` | Month the task was completed. |
| `delivered`      | `string` | `false` | Date the task was completed. |
| `description`      | `string` | `false` | Description of the task. |

<br>

### Delete task
#### You can only delete own tasks.

```
  DELETE /api/v1/tasks/${id}
```
| HTTP headers | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `Authorization`      | `bearer token` | `true` | Valid JWT token generated at login. |

| Request parameters | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `id`      | `string` | `true` | ID task. |

</details>
