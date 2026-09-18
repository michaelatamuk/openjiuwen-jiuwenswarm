package com.jiuwenswarm.study.data

import kotlinx.serialization.Serializable

@Serializable
data class ContentRoot(
    val version: Int = 1,
    val topics: List<TopicDto> = emptyList(),
)

@Serializable
data class TopicDto(
    val id: String,
    val title: String,
    val questions: List<QuestionDto> = emptyList(),
)

@Serializable
data class QuestionDto(
    val id: String,
    val topicId: String,
    val topicTitle: String,
    val number: Int,
    val question: String,
    val general: String = "",
    val jiuwen: String = "",
    val gap: String = "",
    val diagram: String = "",
    val anchors: List<AnchorDto> = emptyList(),
)

@Serializable
data class AnchorDto(
    val ref: String,
    val desc: String = "",
)
