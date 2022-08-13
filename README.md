# Wrkload API

wrkload API is a simple, easy-to-use API that is focused on the documentation of the time that a user takes to do a task.
## License

[MIT](https://choosealicense.com/licenses/mit/)

## Auth API References

<details>
<summary>See all details</summary>

### Register

```
  POST /api/v1/auth/register
```

| Request object | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `username`      | `string` | `true` | Name of the new user. |
| `email`      | `string` | `true` | Valid email of the new user. |
| `avatar`      | `string` | `true` | URL of image. |
| `password`      | `string` | `true` | Password of at least 8 characters. |

<br>

### Login

```
  POST /api/v1/auth/login
```
| Request object | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `email`      | `string` | `true` | Valid email of the new user. |
| `password`      | `string` | `true` | Password of at least 8 characters. |

<br>

### Confirm account
#### Link with confirmation token sent by email.

```
  PATCH /api/v1/auth/confirm-account/${confirmation_token}
```

| Request parameters | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `confirmation_token`      | `string` | `true` | Valid JWT token generated at registry and distributed by mail. |

<br>

### Resend confirm account link

```
  POST /api/v1/auth/resend-confirm-account
```

| Request object | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `email`      | `string` | `true` | Valid email of the new user. |

<br>

### Change password

```
  PATCH /api/v1/auth/change-password
```

| HTTP headers | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `Authorization`      | `bearer token` | `true` | Valid JWT token generated at login and stored in memory. |

| Request object | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `email`      | `string` | `true` | Valid email of the new user. |
| `old_password`      | `string` | `true` | Password of at least 8 characters. |
| `new_password`      | `string` | `true` | Password of at least 8 characters. |

<br>

### Forgot password

```
  POST /api/v1/auth/forgot-password
```
| Request object | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `email`      | `string` | `true` | Valid email of the new user. |

<br>

### Reset password

```
  PATCH /api/v1/auth/reset-password/${uid}/${reset_password_token}
```

| Request parameters | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `uid`      | `string` | `true` | User ID. |
| `reset_password_token`      | `string` | `true` | Valid JWT token generated at forgot password request. |

| Request object | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `new_password`      | `string` | `true` | Password of at least 8 characters. |

<br>

### Logout

```
  GET /api/v1/auth/logout
```
| Cookies | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `refresh_token`      | `HttpOnly` | `true` | Valid JWT token generated at login stored in cookie only accessible through https requests. |

<br>

### Access token generator

```
  GET /api/v1/auth/token
```

| HTTP headers | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `Authorization`      | `bearer token` | `true` | Valid JWT token generated at login and stored in memory. |

| Cookies | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `refresh_token`      | `HttpOnly` | `true` | Valid JWT token generated at login and stored in cookie only accessible through https requests. |

</details>





## Tasks API References

<details>
<summary>See all details</summary>

### Get all tasks
#### Only for users with administrator role.

```
  GET /api/v1/tasks
```

| HTTP headers | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `Authorization`      | `bearer token` | `true` | Valid JWT token generated at login and stored in memory. |

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
| `Authorization`      | `bearer token` | `true` | Valid JWT token generated at login and stored in memory. |

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
| `Authorization`      | `bearer token` | `true` | Valid JWT token generated at login and stored in memory. |

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
| `Authorization`      | `bearer token` | `true` | Valid JWT token generated at login and stored in memory. |

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
| `Authorization`      | `bearer token` | `true` | Valid JWT token generated at login and stored in memory. |

| Request parameters | Type     | Required     | Description                       |
| :-------- | :------- | :------- | :-------------------------------- |
| `id`      | `string` | `true` | ID task. |

</details>
