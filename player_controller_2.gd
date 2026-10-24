extends Node3D

@export var actor: CharacterBody3D
@export var animation_player: AnimationPlayer
@export var MAX_MOVE_SPEED := 10
@export var ACCELERATION := 30
@export var DRAG_ACCEL := 6
@export var GRAVITY := 30.0
@export var JUMP_VELOCITY := 10.0
@export var DOUBLE_JUMP_VELOCITY := 12.0
@export var TRIPLE_JUMP_VELOCITY := 15.0
@export var JUMP_COMBO_WINDOW := 0.20
@export var MIN_TRIPLE_JUMP_SPEED := 4.0
@export var RUN_ANIMATION_THRESHOLD := 0.25
@export var ANIMATION_BLEND_TIME := 0.12

const PROGRESS_CHARS = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
const IDLE_ANIMATION := &"idle"
const RUN_ANIMATION := &"run"
const JUMP_ANIMATIONS := {
	1: &"jump-combo-1",
	2: &"jump-combo-2",
	3: &"jump-combo-3",
}
const ANIMATION_ALIASES := {
	IDLE_ANIMATION: [&"idle", &"idle-loop"],
	RUN_ANIMATION: [&"run", &"run-loop"],
	&"jump-combo-1": [&"jump-combo-1"],
	&"jump-combo-2": [&"jump-combo-2"],
	&"jump-combo-3": [&"jump-combo-3", &"jump-combo-3-start"],
}

var _animation_state := &""
var _jump_combo_step := 0
var _jump_combo_time_left := 0.0


func _ready() -> void:
	if animation_player == null and actor != null:
		animation_player = actor.find_child("AnimationPlayer", true, false) as AnimationPlayer

	if animation_player == null:
		push_warning("PlayerController could not find an AnimationPlayer below the actor.")
		return

	animation_player.animation_finished.connect(_on_animation_finished)
	_set_looping(&"idle-loop")
	_set_looping(&"run-loop")
	_set_looping(&"jump-combo-3-loop")
	_play_animation(IDLE_ANIMATION)

func _physics_process(delta: float) -> void:
	var input_vector := Input.get_vector("pc_backward", "pc_forward", "pc_left", "pc_right", 0.2)
	var move_vector := Vector3(input_vector.x, 0, input_vector.y)
	var was_on_floor := actor.is_on_floor()
	var horizontal_velocity := Vector3(actor.velocity.x, 0, actor.velocity.z)
	
	var move_accel : Vector3
	
	if input_vector.is_equal_approx(Vector2.ZERO):
		# Drag Force
		move_accel = -horizontal_velocity * DRAG_ACCEL
	else:
		# Move Force
		move_accel = move_vector * ACCELERATION
	
	actor.velocity += (move_accel) * delta

	if was_on_floor:
		if actor.velocity.y < 0.0:
			actor.velocity.y = 0.0
	else:
		actor.velocity.y -= GRAVITY * delta

	if was_on_floor and _jump_combo_time_left > 0.0:
		_jump_combo_time_left = maxf(_jump_combo_time_left - delta, 0.0)
		if is_zero_approx(_jump_combo_time_left):
			_jump_combo_step = 0

	if was_on_floor and Input.is_action_just_pressed("ui_accept"):
		_start_jump(horizontal_velocity.length())
	
	var PREFIX = PROGRESS_CHARS[(Time.get_ticks_msec() / 100) % PROGRESS_CHARS.size()]
	
	print("%s SPEED: %5.2f / %d.  Move: %5.2f" % [PREFIX, actor.velocity.length(), MAX_MOVE_SPEED, move_accel.length()])
	
	var horizontal := Vector3(actor.velocity.x, 0, actor.velocity.z)
	if horizontal.length() > MAX_MOVE_SPEED:
		horizontal = horizontal.normalized() * MAX_MOVE_SPEED
		actor.velocity.x = horizontal.x
		actor.velocity.z = horizontal.z
	
	horizontal_velocity = Vector3(actor.velocity.x, 0, actor.velocity.z)
	var look_at_target = actor.global_position + horizontal_velocity
	if !actor.global_position.is_equal_approx(look_at_target):
		actor.look_at(look_at_target, Vector3.UP)
	
	actor.move_and_slide()

	var is_on_floor_now := actor.is_on_floor()
	if not was_on_floor and is_on_floor_now and _jump_combo_step > 0:
		_jump_combo_time_left = JUMP_COMBO_WINDOW

	_update_animation(is_on_floor_now)


func _start_jump(horizontal_speed: float) -> void:
	if _jump_combo_time_left <= 0.0:
		_jump_combo_step = 1
	elif _jump_combo_step == 1:
		_jump_combo_step = 2
	elif _jump_combo_step == 2 and horizontal_speed >= MIN_TRIPLE_JUMP_SPEED:
		_jump_combo_step = 3
	else:
		# As in Mario 64, a slow third attempt falls back to a regular jump.
		_jump_combo_step = 1

	_jump_combo_time_left = 0.0
	match _jump_combo_step:
		1:
			actor.velocity.y = JUMP_VELOCITY
		2:
			actor.velocity.y = DOUBLE_JUMP_VELOCITY
		3:
			actor.velocity.y = TRIPLE_JUMP_VELOCITY

	_play_animation(JUMP_ANIMATIONS[_jump_combo_step])


func _update_animation(is_on_floor_now: bool) -> void:
	if not is_on_floor_now:
		# Walking off a ledge uses the basic jump/fall pose.
		var airborne_step := maxi(_jump_combo_step, 1)
		_play_animation(JUMP_ANIMATIONS[airborne_step])
		return

	var horizontal_speed := Vector2(actor.velocity.x, actor.velocity.z).length()
	if horizontal_speed > RUN_ANIMATION_THRESHOLD:
		if animation_player != null:
			animation_player.speed_scale = lerpf(0.75, 1.35, clampf(horizontal_speed / MAX_MOVE_SPEED, 0.0, 1.0))
		_play_animation(RUN_ANIMATION)
	else:
		if animation_player != null:
			animation_player.speed_scale = 1.0
		_play_animation(IDLE_ANIMATION)


func _play_animation(state: StringName) -> void:
	if animation_player == null or state == _animation_state:
		return

	var clip := _find_animation(state)
	if clip.is_empty():
		push_warning("PlayerController could not find animation '%s'." % state)
		return

	_animation_state = state
	animation_player.speed_scale = 1.0 if state != RUN_ANIMATION else animation_player.speed_scale
	animation_player.play(clip, ANIMATION_BLEND_TIME)


func _find_animation(state: StringName) -> StringName:
	for candidate: StringName in ANIMATION_ALIASES.get(state, [state]):
		if animation_player.has_animation(candidate):
			return candidate
	return &""


func _set_looping(clip_name: StringName) -> void:
	if animation_player.has_animation(clip_name):
		animation_player.get_animation(clip_name).loop_mode = Animation.LOOP_LINEAR


func _on_animation_finished(clip_name: StringName) -> void:
	if (
		_animation_state == &"jump-combo-3"
		and not actor.is_on_floor()
		and clip_name != &"jump-combo-3-loop"
		and animation_player.has_animation(&"jump-combo-3-loop")
	):
		animation_player.play(&"jump-combo-3-loop")
